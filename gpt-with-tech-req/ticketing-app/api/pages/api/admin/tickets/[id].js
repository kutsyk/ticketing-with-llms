// pages/api/admin/tickets/[id].js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID (ADMIN only)
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
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update ticket (ADMIN only)
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
 *               status:
 *                 type: string
 *                 enum: [VALID, USED, EXPIRED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *   delete:
 *     summary: Delete ticket (ADMIN only)
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
 *         description: Deleted successfully
 */
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ticket ID' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        event: { select: { id: true, name: true } },
        ticket_type: { select: { id: true, name: true } }
      }
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(ticket);
  }

  if (req.method === 'PATCH') {
    const { status, notes } = req.body || {};
    const data = {};
    if (status) {
      data.status = String(status).toUpperCase();
    }
    if (notes !== undefined) {
      data.notes = String(notes);
    }

    const before = await prisma.ticket.findUnique({ where: { id } });
    if (!before) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true, name: true } },
        event: { select: { id: true, name: true } },
        ticket_type: { select: { id: true, name: true } }
      }
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'UPDATE',
        entity: 'tickets',
        entity_id: id,
        diff: { before, after: updated }
      }
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.ticket.delete({ where: { id } });
    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'DELETE',
        entity: 'tickets',
        entity_id: id,
        diff: { before: existing, after: null }
      }
    });

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
