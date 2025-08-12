// pages/api/seller/issue.js

import prisma from '../../../lib/db/client.js';
import { verifyToken } from '../../../lib/auth/jwt.js';
import { issueTicket } from '../../../lib/tickets/issue.js';

/**
 * @openapi
 * /api/seller/issue:
 *   post:
 *     summary: Issue a ticket
 *     description: Allows an ADMIN or SELLER to issue a ticket for an event they manage.
 *     tags:
 *       - Seller
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - ticketTypeId
 *               - email
 *               - name
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketTypeId:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               sendEmail:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Ticket issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event or ticket type not found
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Only ADMIN or SELLER can issue tickets
  if (!['ADMIN', 'SELLER'].includes(me.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { eventId, ticketTypeId, email, name, sendEmail = true } = req.body || {};
  if (!eventId || !ticketTypeId || !email || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify event exists and belongs to this seller (or admin)
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    include: { seller: true }
  });

  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (me.role === 'SELLER' && event.seller_id !== me.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Verify ticket type exists
  const ticketType = await prisma.ticket_types.findUnique({
    where: { id: ticketTypeId }
  });
  if (!ticketType) return res.status(404).json({ error: 'Ticket type not found' });

  try {
    const ticket = await issueTicket({
      eventId,
      ticketTypeId,
      email,
      name,
      issuedBy: me.id,
      sendEmail
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error('Error issuing ticket:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
