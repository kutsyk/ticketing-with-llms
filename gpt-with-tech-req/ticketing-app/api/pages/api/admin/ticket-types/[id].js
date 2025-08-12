// pages/api/admin/ticket-types/[id].js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/ticket-types/{id}:
 *   get:
 *     summary: Get a ticket type (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket type details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *       404:
 *         description: Ticket type not found
 *   patch:
 *     summary: Update a ticket type (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       200:
 *         description: Updated ticket type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketType'
 *   delete:
 *     summary: Delete a ticket type (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Ticket type deleted
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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket type ID' });
  }

  if (req.method === 'GET') {
    const ticketType = await prisma.ticket_types.findUnique({
      where: { id: String(id) }
    });

    if (!ticketType) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    return res.json(ticketType);
  }

  if (req.method === 'PATCH') {
    const data = {};
    const { name, description, price, quantity, sales_start, sales_end } = req.body || {};

    if (name !== undefined) data.name = String(name);
    if (description !== undefined) data.description = String(description);
    if (price !== undefined) data.price = parseFloat(price);
    if (quantity !== undefined) data.quantity = parseInt(quantity, 10);
    if (sales_start !== undefined) data.sales_start = sales_start ? new Date(sales_start) : null;
    if (sales_end !== undefined) data.sales_end = sales_end ? new Date(sales_end) : null;

    const before = await prisma.ticket_types.findUnique({ where: { id: String(id) } });
    if (!before) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    const updated = await prisma.ticket_types.update({
      where: { id: String(id) },
      data
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'UPDATE',
        entity: 'ticket_types',
        entity_id: id,
        diff: { before, after: updated }
      }
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.ticket_types.findUnique({ where: { id: String(id) } });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    await prisma.ticket_types.delete({ where: { id: String(id) } });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'DELETE',
        entity: 'ticket_types',
        entity_id: id,
        diff: { before: existing, after: null }
      }
    });

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
