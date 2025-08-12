// lib/payments/stripe.js
//
// Stripe provider with automatic mock fallback.
// - Real mode: requires STRIPE_SECRET_KEY; uses Checkout Sessions + Webhooks
// - Mock mode: enabled if PAYMENTS_DISABLED=true OR no STRIPE_SECRET_KEY
//   Returns deterministic objects so your app flow works end-to-end without Stripe.
//
// Exposed helpers:
//   isEnabled()
//   getMode()                               -> 'stripe' | 'mock'
//   createCheckoutSession(opts)
//   retrieveCheckoutSession(sessionId)
//   retrievePaymentIntent(paymentIntentId)
//   refundPayment({ paymentIntentId, amountCents? })
//   verifyWebhook({ rawBody, signature })
//
// Notes for API routes:
// - For webhook verification in Next.js API routes, disable the body parser and read the raw body.
//   In pages router, set: export const config = { api: { bodyParser: false } }
//   Then read raw body with `getRawBody(req)` in the route and pass it here.
// - For createCheckoutSession, pass finalized Stripe line items or call a mapper in your route
//   to convert ticket types/qty to Stripe price_data.

import Stripe from 'stripe';

// ----------------------- Env & Mode ------------------------

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const CURRENCY_DEFAULT = process.env.STRIPE_CURRENCY || 'usd';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4200'; // Angular app default
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const PAYMENTS_DISABLED =
  String(process.env.PAYMENTS_DISABLED || '').toLowerCase() === 'true' ||
  !STRIPE_SECRET_KEY;

let stripeSingleton = null;

/** @returns {Stripe|null} */
function getStripe() {
  if (PAYMENTS_DISABLED) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20', // stable version
      httpClient: Stripe.createFetchHttpClient()
    });
  }
  return stripeSingleton;
}

export function isEnabled() {
  return !PAYMENTS_DISABLED;
}

export function getMode() {
  return isEnabled() ? 'stripe' : 'mock';
}

// ----------------------- Utilities ------------------------

/**
 * Normalize line items to Stripe format.
 * Accept either:
 *  - Stripe line items already ({ price, quantity } or { price_data, quantity })
 *  - Minimal items { name, unit_amount_cents, quantity, currency? }
 */
function toStripeLineItems(items) {
  return (items || []).map((it) => {
    if (it.price || it.price_data) {
      return it; // already Stripe format
    }
    const currency = (it.currency || CURRENCY_DEFAULT).toLowerCase();
    return {
      quantity: it.quantity ?? it.qty ?? 1,
      price_data: {
        currency,
        unit_amount: Number(it.unit_amount_cents ?? it.amount_cents ?? it.price_cents ?? 0),
        product_data: {
          name: it.name || 'Ticket',
          description: it.description || undefined,
          metadata: it.metadata || undefined
        }
      }
    };
  });
}

/** Build default success/cancel URLs if not provided */
function buildUrls({ successUrl, cancelUrl, sessionIdPlaceholder = '{CHECKOUT_SESSION_ID}' }) {
  const success =
    successUrl ||
    `${APP_BASE_URL}/orders/complete?session_id=${encodeURIComponent(sessionIdPlaceholder)}`;
  const cancel = cancelUrl || `${APP_BASE_URL}/checkout/cancelled`;
  return { success, cancel };
}

// ----------------------- Real Stripe ----------------------

async function stripeCreateCheckoutSession(opts) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const {
    items,
    successUrl,
    cancelUrl,
    customerEmail,
    metadata,
    mode = 'payment',
    // allow passing customer, customer_creation, etc. if you need
    ...rest
  } = opts || {};

  const line_items = toStripeLineItems(items);
  const urls = buildUrls({ successUrl, cancelUrl });

  const session = await stripe.checkout.sessions.create({
    mode,
    payment_method_types: ['card'],
    line_items,
    success_url: urls.success,
    cancel_url: urls.cancel,
    customer_email: customerEmail || undefined,
    metadata: metadata || undefined,
    // You can control tax/shipping if needed:
    // automatic_tax: { enabled: false },
    ...rest
  });

  return {
    provider: 'STRIPE',
    id: session.id,
    url: session.url,
    amount_cents: sumLineItemsCents(line_items),
    currency: (line_items[0]?.price_data?.currency || CURRENCY_DEFAULT).toUpperCase(),
    raw: session
  };
}

async function stripeRetrieveCheckoutSession(sessionId) {
  const stripe = getStripe();
  const sess = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer']
  });
  return sess;
}

async function stripeRetrievePaymentIntent(paymentIntentId) {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

async function stripeRefundPayment({ paymentIntentId, amountCents }) {
  const stripe = getStripe();
  const params = {
    payment_intent: paymentIntentId
  };
  if (Number.isFinite(amountCents)) {
    // Stripe expects amounts in the smallest currency unit (cents)
    // Only pass if partial refund; omit for full refund
    params.amount = Number(amountCents);
  }
  const refund = await stripe.refunds.create(params);
  return refund;
}

/**
 * Verify webhook signature and return the event.
 * @param {{rawBody: Buffer|string, signature: string}} p
 */
function stripeVerifyWebhook({ rawBody, signature }) {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET missing');
  }
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}

// ----------------------- Mock Mode ------------------------

let mockCounter = 1;

function mockId(prefix) {
  const n = mockCounter++;
  return `${prefix}_${Date.now()}_${n}`;
}

function sumLineItemsCents(line_items) {
  try {
    return (line_items || []).reduce((acc, li) => {
      const qty = Number(li.quantity || 1);
      const amt =
        li.price_data?.unit_amount ??
        li.price?.unit_amount ??
        li.unit_amount ??
        0;
      return acc + qty * Number(amt || 0);
    }, 0);
  } catch {
    return 0;
  }
}

async function mockCreateCheckoutSession(opts) {
  const { items, successUrl, cancelUrl, customerEmail, metadata } = opts || {};
  const line_items = toStripeLineItems(items);
  const urls = buildUrls({ successUrl, cancelUrl, sessionIdPlaceholder: 'mock_session_id' });

  const amount_cents = sumLineItemsCents(line_items);
  const session = {
    id: mockId('cs_test'),
    object: 'checkout.session',
    url: `${urls.success}&mock=1`,
    payment_status: 'paid',
    status: 'complete',
    customer_email: customerEmail || null,
    metadata: metadata || null,
    amount_subtotal: amount_cents,
    amount_total: amount_cents,
    currency: (line_items[0]?.price_data?.currency || CURRENCY_DEFAULT).toLowerCase(),
    payment_intent: mockId('pi_test')
  };

  return {
    provider: 'MOCK',
    id: session.id,
    url: session.url,
    amount_cents,
    currency: session.currency.toUpperCase(),
    raw: session
  };
}

async function mockRetrieveCheckoutSession(sessionId) {
  return {
    id: sessionId,
    object: 'checkout.session',
    payment_status: 'paid',
    status: 'complete',
    payment_intent: mockId('pi_test'),
    amount_total: 0,
    currency: CURRENCY_DEFAULT
  };
}

async function mockRetrievePaymentIntent(paymentIntentId) {
  return {
    id: paymentIntentId,
    object: 'payment_intent',
    status: 'succeeded',
    amount: 0,
    currency: CURRENCY_DEFAULT
  };
}

async function mockRefundPayment({ paymentIntentId, amountCents }) {
  return {
    id: mockId('re_test'),
    object: 'refund',
    status: 'succeeded',
    amount: amountCents || null,
    payment_intent: paymentIntentId
  };
}

function mockVerifyWebhook({ rawBody, signature }) {
  // In mock mode, accept everything and synthesize a paid session.completed event
  const now = Math.floor(Date.now() / 1000);
  return {
    id: mockId('evt_test'),
    type: 'checkout.session.completed',
    created: now,
    data: {
      object: {
        id: mockId('cs_test'),
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        payment_intent: mockId('pi_test'),
        amount_total: 0,
        currency: CURRENCY_DEFAULT
      }
    }
  };
}

// ----------------------- Public API -----------------------

/**
 * Create a checkout session.
 * @param {Object} opts
 * @param {Array} opts.items - Stripe line items or simplified items {name, unit_amount_cents, quantity, currency?}
 * @param {string} [opts.successUrl]
 * @param {string} [opts.cancelUrl]
 * @param {string} [opts.customerEmail]
 * @param {Object} [opts.metadata]
 * @param {('payment'|'subscription'|'setup')} [opts.mode]
 * @returns {Promise<{provider:'STRIPE'|'MOCK', id:string, url:string, amount_cents:number, currency:string, raw:any}>}
 */
export async function createCheckoutSession(opts) {
  if (PAYMENTS_DISABLED) {
    return mockCreateCheckoutSession(opts);
  }
  return stripeCreateCheckoutSession(opts);
}

/** @returns {Promise<any>} Stripe Checkout.Session (or mock object) */
export async function retrieveCheckoutSession(sessionId) {
  if (PAYMENTS_DISABLED) {
    return mockRetrieveCheckoutSession(sessionId);
  }
  return stripeRetrieveCheckoutSession(sessionId);
}

/** @returns {Promise<any>} Stripe PaymentIntent (or mock object) */
export async function retrievePaymentIntent(paymentIntentId) {
  if (PAYMENTS_DISABLED) {
    return mockRetrievePaymentIntent(paymentIntentId);
  }
  return stripeRetrievePaymentIntent(paymentIntentId);
}

/**
 * Issue a refund for a payment intent.
 * @param {{paymentIntentId:string, amountCents?:number}} p
 */
export async function refundPayment(p) {
  if (PAYMENTS_DISABLED) {
    return mockRefundPayment(p);
  }
  return stripeRefundPayment(p);
}

/**
 * Verify and parse a webhook event.
 * In real mode, checks the Stripe signature; in mock mode, returns a synthesized "session completed".
 * @param {{rawBody: Buffer|string, signature: string}} p
 * @returns {any} event
 */
export function verifyWebhook(p) {
  if (PAYMENTS_DISABLED) {
    return mockVerifyWebhook(p);
  }
  return stripeVerifyWebhook(p);
}

// ----------------------- Helpers for Routes -----------------------

/**
 * Read raw body in a Next.js Pages API route (bodyParser disabled).
 * Usage in route:
 *   export const config = { api: { bodyParser: false } }
 *   const rawBody = await getRawBody(req);
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
export function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
