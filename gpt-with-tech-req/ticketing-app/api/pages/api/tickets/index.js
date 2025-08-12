// pages/api/tickets/index.js

import prisma from '../../../lib/db/client.js';
import { verifyToken } from '../../../lib/auth/jwt.js';
import { issueTicket } from '../../../lib/tickets/issue.js';

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     summary: List tickets
 *     description: Returns a list of tickets for the authenticated user. Admins can see all tickets.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by event ID
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *   post:
 *     summary: Issue a new ticket
 *     description: Issues a new ticket for the authenticated user.
 *     tags:
 *       - Tickets
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
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketTypeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    const { eventId } = req.query;
    const where = {};

    if (eventId) where.event_id = eventId;
    if (me.role !== 'ADMIN') where.user_id = me.id;

    const tickets = await prisma.ticket.findMany({
      where,
      include: { event: true, ticket_type: true }
    });

    return res.status(200).json({ items: tickets });
  }

  if (req.method === 'POST') {
    const { eventId, ticketTypeId } = req.body || {};
    if (!eventId || !ticketTypeId) {
      return res.status(400).json({ error: 'Missing eventId or ticketTypeId' });
    }

    // Verify ticket type exists
    const ticketType = await prisma.ticket_types.findUnique({
      where: { id: ticketTypeId },
      include: { event: true }
    });
    if (!ticketType || ticketType.event_id !== eventId) {
      return res.status(400).json({ error: 'Invalid ticket type or event' });
    }

    // Issue ticket
    const ticket = await issueTicket({
      eventId,
      userId: me.id,
      ticketTypeId
    });

    return res.status(201).json(ticket);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
