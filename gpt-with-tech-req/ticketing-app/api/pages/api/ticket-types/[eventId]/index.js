// pages/api/ticket-types/[eventId]/index.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/ticket-types/{eventId}:
 *   get:
 *     summary: List ticket types for event
 *     tags:
 *       - Ticket Types
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of ticket types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketType'
 *       404:
 *         description: Event not found
 *
 *   post:
 *     summary: Create a ticket type for event
 *     description: Requires ADMIN role.
 *     tags:
 *       - Ticket Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketTypeCreate'
 *     responses:
 *       201:
 *         description: Ticket type created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */

export default async function handler(req, res) {
  if (req.method === 'GET') return listTicketTypes(req, res);
  if (req.method === 'POST') return createTicketType(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function listTicketTypes(req, res) {
  const { eventId } = req.query;
  const event = await prisma.events.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const ticketTypes = await prisma.ticket_types.findMany({ where: { event_id: eventId } });
  return res.status(200).json(ticketTypes);
}

async function createTicketType(req, res) {
  const { eventId } = req.query;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (me.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const event = await prisma.events.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { name, price, currency, quantity } = req.body || {};
  if (!name || price === undefined || !currency || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ticketType = await prisma.ticket_types.create({
    data: {
      event_id: eventId,
      name: String(name),
      price: parseFloat(price),
      currency: String(currency).toUpperCase(),
      quantity: parseInt(quantity, 10)
    }
  });

  return res.status(201).json(ticketType);
}
