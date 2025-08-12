// pages/api/checkout/webhook.js

import { buffer } from 'micro';
import stripe from '../../../lib/payments/stripe.js';
import prisma from '../../../lib/db/client.js';
import { issueTicket } from '../../../lib/tickets/issue.js';
import { sendTicketEmail } from '../../../lib/email/send.js';

export const config = {
  api: {
    bodyParser: false // Stripe requires raw body
  }
};

/**
 * @openapi
 * /api/checkout/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Receives events from Stripe to confirm payment and issue tickets.
 *     tags:
 *       - Checkout
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or event
 *       500:
 *         description: Internal server error
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Retrieve metadata or custom data from checkout session if needed
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const ticketTypeName = lineItems.data[0]?.description;

      // Find ticket type in DB
      const ticketType = await prisma.ticket_types.findFirst({
        where: { name: ticketTypeName },
        include: { event: true }
      });

      if (ticketType) {
        // Issue tickets for this purchase
        const quantity = lineItems.data[0]?.quantity || 1;
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
          const ticket = await issueTicket({
            eventId: ticketType.event_id,
            userEmail: session.customer_email,
            ticketTypeId: ticketType.id
          });
          tickets.push(ticket);
        }

        // Send ticket email
        await sendTicketEmail({
          to: session.customer_email,
          event: ticketType.event,
          tickets
        });

        // Audit log
        await prisma.audit_logs.create({
          data: {
            actor_user_id: null, // external purchase
            action: 'ISSUE',
            entity: 'tickets',
            entity_id: tickets.map(t => t.id).join(','),
            diff: { before: null, after: tickets }
          }
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handling error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
