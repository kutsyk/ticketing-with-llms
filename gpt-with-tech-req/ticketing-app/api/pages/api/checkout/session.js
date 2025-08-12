// pages/api/checkout/session.js

import { verifyToken } from '../../../lib/auth/jwt.js';
import prisma from '../../../lib/db/client.js';
import stripe from '../../../lib/payments/stripe.js';

/**
 * @openapi
 * /api/checkout/session:
 *   post:
 *     summary: Create a checkout session
 *     description: Creates a Stripe Checkout Session for purchasing tickets for a specific event.
 *     tags:
 *       - Checkout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_type_id
 *               - quantity
 *             properties:
 *               ticket_type_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket type not found
 *       500:
 *         description: Stripe error
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { ticket_type_id, quantity } = req.body || {};
  if (!ticket_type_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  const ticketType = await prisma.ticket_types.findUnique({
    where: { id: ticket_type_id },
    include: { event: true }
  });
  if (!ticketType) return res.status(404).json({ error: 'Ticket type not found' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: me.email,
      line_items: [
        {
          price_data: {
            currency: ticketType.currency.toLowerCase(),
            product_data: {
              name: `${ticketType.name} - ${ticketType.event.name}`,
              description: ticketType.event.description || ''
            },
            unit_amount: Math.round(ticketType.price * 100)
          },
          quantity
        }
      ],
      success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/checkout/cancel`
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
