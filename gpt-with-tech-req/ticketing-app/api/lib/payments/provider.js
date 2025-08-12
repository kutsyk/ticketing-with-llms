// lib/payments/provider.js
//
// High-level payment facade that abstracts real Stripe vs mock mode,
// and persists Payment rows with Prisma.
//
// Responsibilities:
// - Create checkout session & create a payments row (REQUIRES_ACTION or PAID in mock)
// - Verify/normalize webhook events and update payments to PAID
// - Issue refunds and update payments to REFUNDED
//
// Usage in routes:
//   import * as Pay from '../../lib/payments/provider';
//
//   // Create checkout
//   const { sessionUrl, sessionId, payment } = await Pay.createCheckout({
//     userId: me?.id ?? null,
//     email: me?.email ?? body.email,
//     items: [{ name: 'GA Ticket', unit_amount_cents: 5000, quantity: 2, currency: 'USD' }],
//     successUrl: `${APP_BASE_URL}/orders/complete`,
//     cancelUrl: `${APP_BASE_URL}/checkout/cancelled`,
//     metadata: { eventId, ticketTypeId }
//   });
//   res.json({ url: sessionUrl, sessionId, paymentId: payment.id });
//
//   // Webhook (bodyParser disabled)
//   export const config = { api: { bodyParser: false } };
//   export default async function handler(req, res) {
//     const rawBody = await getRawBody(req); // or Pay.getRawBody from stripe.js if re-exported
//     const signature = req.headers['stripe-signature'] || '';
//     const result = await Pay.handleWebhook({ rawBody, signature });
//     if (result.ok) return res.status(200).json({ received: true });
//     return res.status(400).json({ error: result.error });
//   }

import prisma from '../db/client.js';
import {
  isEnabled as stripeEnabled,
  getMode as stripeMode,
  createCheckoutSession,
  retrieveCheckoutSession,
  retrievePaymentIntent,
  refundPayment,
  verifyWebhook
} from './stripe.js';

// ----------------------------- Constants ------------------------------

export const PROVIDERS = /** @type {const} */ ({
  STRIPE: 'STRIPE',
  MOCK: 'MOCK'
});

export const PaymentStatus = /** @type {const} */ ({
  REQUIRES_ACTION: 'REQUIRES_ACTION',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
});

// ----------------------------- Helpers --------------------------------

/**
 * Sum simplified items (in cents). Accepts either Stripe line items or simplified items.
 * @param {Array<any>} items
 */
function sumItemsCents(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, it) => {
    if (it.price || it.price_data) {
      const qty = Number(it.quantity || 1);
      const amt =
        it.price_data?.unit_amount ??
        it.price?.unit_amount ??
        it.unit_amount ??
        0;
      return acc + qty * Number(amt || 0);
    }
    // simplified
    const qty = Number(it.quantity ?? it.qty ?? 1);
    const unit = Number(it.unit_amount_cents ?? it.amount_cents ?? it.price_cents ?? 0);
    return acc + qty * unit;
  }, 0);
}

function firstCurrency(items, fallback = 'USD') {
  for (const it of items || []) {
    const c =
      it?.price_data?.currency ||
      it?.price?.currency ||
      it?.currency;
    if (c) return String(c).toUpperCase();
  }
  return fallback.toUpperCase();
}

export function isPaymentsEnabled() {
  return stripeEnabled();
}

export function getPaymentsMode() {
  return stripeMode() === 'stripe' ? PROVIDERS.STRIPE : PROVIDERS.MOCK;
}

// ----------------------------- Create Checkout ------------------------

/**
 * Create a checkout session and persist a Payment row.
 * In mock mode, the payment is immediately marked PAID.
 *
 * @param {Object} p
 * @param {string|null} [p.userId]
 * @param {string} [p.email]
 * @param {Array<any>} p.items  // Stripe line items or simplified items {name, unit_amount_cents, quantity, currency?}
 * @param {string} [p.successUrl]
 * @param {string} [p.cancelUrl]
 * @param {Record<string, any>} [p.metadata]
 * @returns {Promise<{ sessionUrl: string, sessionId: string, payment: any }>}
 */
export async function createCheckout({ userId = null, email, items, successUrl, cancelUrl, metadata }) {
  const provider = getPaymentsMode();
  const amount_cents = sumItemsCents(items);
  const currency = firstCurrency(items);

  const sess = await createCheckoutSession({
    items,
    successUrl,
    cancelUrl,
    customerEmail: email,
    metadata
  });

  // Persist a payment row
  let status = PaymentStatus.REQUIRES_ACTION;
  if (provider === PROVIDERS.MOCK) {
    // In mock, act as if already paid
    status = PaymentStatus.PAID;
  }

  const payment = await prisma.payment.create({
    data: {
      user_id: userId,
      provider,
      provider_payment_id: sess.id,
      amount_cents,
      currency,
      status
    }
  });

  return {
    sessionUrl: sess.url,
    sessionId: sess.id,
    payment
  };
}

// ----------------------------- Webhook --------------------------------

/**
 * Verify the incoming webhook and update local payment records.
 * For Stripe real mode, this marks payments PAID when a session completes.
 * For mock mode, it accepts any payload and also marks as PAID.
 *
 * Returns { ok: true, normalized?, paymentId? } on success, or { ok:false, error }.
 *
 * @param {{rawBody: Buffer|string, signature: string}} p
 */
export async function handleWebhook({ rawBody, signature }) {
  try {
    const event = verifyWebhook({ rawBody, signature }); // throws if invalid in real mode
    const provider = getPaymentsMode();

    // Normalize:
    // We primarily care about checkout.session.completed and payment_intent.succeeded
    let sessionId = null;
    let paymentIntentId = null;
    let paid = false;
    let amountCents = null;
    let currency = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data?.object || {};
        sessionId = s.id || null;
        paymentIntentId = s.payment_intent || null;
        paid = (s.payment_status === 'paid') || (s.status === 'complete');
        amountCents = s.amount_total ?? null;
        currency = s.currency ? String(s.currency).toUpperCase() : null;
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data?.object || {};
        paymentIntentId = pi.id || null;
        paid = true;
        amountCents = pi.amount ?? null;
        currency = pi.currency ? String(pi.currency).toUpperCase() : null;
        break;
      }
      default: {
        // For mock mode we synthesize a completed session already
        // For real Stripe, ignore unrelated events
        // Return ok so Stripe doesn't retry webhooks unnecessarily.
        return { ok: true, ignored: true };
      }
    }

    // Find Payment by provider_payment_id (we store session.id there on create)
    // If we only have payment_intent, try match on that as well (depends on how you store it).
    let payment = null;
    if (sessionId) {
      payment = await prisma.payment.findFirst({
        where: { provider_payment_id: sessionId }
      });
    }
    if (!payment && paymentIntentId) {
      payment = await prisma.payment.findFirst({
        where: { provider_payment_id: paymentIntentId }
      });
    }

    if (!payment) {
      // As a fallback, try to retrieve the session and match by id
      if (sessionId) {
        // best-effort: ensure we at least create a record (optional)
        // but generally, we created it on createCheckout
      }
      return { ok: true, ignored: true, reason: 'payment_not_found' };
    }

    // Idempotent update to PAID (only if not already)
    if (paid && payment.status !== PaymentStatus.PAID) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          updated_at: new Date()
        }
      });
    }

    return { ok: true, paymentId: payment.id, provider };
  } catch (err) {
    return { ok: false, error: err?.message || 'webhook_error' };
  }
}

// ----------------------------- Refunds --------------------------------

/**
 * Refund a payment by the local Payment id (partial or full).
 * Updates the DB row to REFUNDED if Stripe/mock returns success.
 *
 * @param {{paymentId: string, amountCents?: number}} p
 */
export async function refundPaymentById({ paymentId, amountCents }) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (!payment.provider_payment_id) {
    throw new Error('Payment missing provider_payment_id');
  }

  const r = await refundPayment({
    paymentIntentId: payment.provider_payment_id,
    amountCents
  });

  // Consider r.status === 'succeeded' as success for both mock & stripe
  const ok = !r || r.status === 'succeeded' || r.object === 'refund';
  if (ok) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED, updated_at: new Date() }
    });
  }

  return { ok, refund: r };
}

// ----------------------------- Admin Helpers --------------------------

/**
 * Force-mark a payment as PAID (admin action; use with care).
 * Useful if a legitimate Stripe payment succeeded but webhook failed to deliver.
 *
 * @param {{paymentId:string, providerPaymentId?:string, amountCents?:number, currency?:string}} p
 */
export async function markPaymentPaid({ paymentId, providerPaymentId, amountCents, currency }) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error('Payment not found');

  const data = {
    status: PaymentStatus.PAID,
    updated_at: new Date()
  };
  if (providerPaymentId) data.provider_payment_id = providerPaymentId;
  if (Number.isFinite(amountCents)) data.amount_cents = Number(amountCents);
  if (currency) data.currency = String(currency).toUpperCase();

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data
  });
  return updated;
}

// ----------------------------- Retrieval ------------------------------

/**
 * Fetch the provider-native checkout session (or mock) for diagnostics.
 * @param {string} sessionId
 */
export async function getProviderSession(sessionId) {
  return retrieveCheckoutSession(sessionId);
}

/**
 * Fetch the provider-native payment intent (or mock) for diagnostics.
 * @param {string} paymentIntentId
 */
export async function getProviderPaymentIntent(paymentIntentId) {
  return retrievePaymentIntent(paymentIntentId);
}
