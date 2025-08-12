// pages/api/tickets/[id].js

import prisma from '../../../lib/db/client.js';
import { verifyToken } from '../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     description: Returns a ticket if the authenticated user owns it or is an admin.
 *     tags:
 *       - Tickets
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
 *         description: Ticket object
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
 *     summary: Update ticket
 *     description: Admin can update any ticket. User can update only their own ticket.
 *     tags:
 *       - Tickets
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
 *                 enum: [ACTIVE, CANCELLED, USED]
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated ticket
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete ticket
 *     description: Admin can delete any ticket. User can delete only their own ticket.
 *     tags:
 *       - Tickets
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */

export default async function handler(req, res) {
  const { id } = req.query;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // GET — Retrieve ticket
  if (req.method === 'GET') {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { event: true, ticket_type: true }
    });
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    if (me.role !== 'ADMIN' && ticket.user_id !== me.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json(ticket);
  }

  // PATCH — Update ticket
  if (req.method === 'PATCH') {
    const { status, email } = req.body || {};
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    if (me.role !== 'ADMIN' && ticket.user_id !== me.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const data = {};
    if (status) {
      const validStatuses = ['ACTIVE', 'CANCELLED', 'USED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      data.status = status;
    }
    if (email) {
      data.email = String(email);
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: { event: true, ticket_type: true }
    });

    return res.status(200).json(updated);
  }

  // DELETE — Remove ticket
  if (req.method === 'DELETE') {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({ error: 'Not found' });
    if (me.role !== 'ADMIN' && ticket.user_id !== me.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.ticket.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
