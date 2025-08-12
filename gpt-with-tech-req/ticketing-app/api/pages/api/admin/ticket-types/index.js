// pages/api/admin/ticket-types/index.js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/ticket-types:
 *   get:
 *     summary: List ticket types (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter ticket types by event ID
 *     responses:
 *       200:
 *         description: List of ticket types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TicketType'
 *   post:
 *     summary: Create a ticket type (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - name
 *               - price
 *               - quantity
 *             properties:
 *               event_id:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               sales_start:
 *                 type: string
 *                 format: date-time
 *               sales_end:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Ticket type created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
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

  if (me.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const { eventId } = req.query;
    const where = {};
    if (eventId) {
      where.event_id = String(eventId);
    }

    const ticketTypes = await prisma.ticket_types.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return res.json(ticketTypes);
  }

  if (req.method === 'POST') {
    const { event_id, name, description, price, quantity, sales_start, sales_end } = req.body || {};

    if (!event_id || !name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventExists = await prisma.event.findUnique({ where: { id: String(event_id) } });
    if (!eventExists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const created = await prisma.ticket_types.create({
      data: {
        event_id: String(event_id),
        name: String(name),
        description: description ? String(description) : null,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        sales_start: sales_start ? new Date(sales_start) : null,
        sales_end: sales_end ? new Date(sales_end) : null
      }
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'CREATE',
        entity: 'ticket_types',
        entity_id: created.id,
        diff: { before: null, after: created }
      }
    });

    return res.status(201).json(created);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
