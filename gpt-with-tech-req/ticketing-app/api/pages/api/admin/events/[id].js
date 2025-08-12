// pages/api/admin/events/[id].js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/events/{id}:
 *   get:
 *     summary: Get a single event (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *   patch:
 *     summary: Update an event (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
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
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               venue:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               cover_image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated event
 *       404:
 *         description: Event not found
 *   delete:
 *     summary: Delete an event (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted
 *       404:
 *         description: Event not found
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
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  if (req.method === 'GET') {
    const event = await prisma.events.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Not found' });
    return res.json(event);
  }

  if (req.method === 'PATCH') {
    const existing = await prisma.events.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { name, description, start_date, end_date, venue, capacity, cover_image_url } = req.body || {};

    const updated = await prisma.events.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name) }),
        ...(description !== undefined && { description: String(description) }),
        ...(start_date !== undefined && { start_date: new Date(start_date) }),
        ...(end_date !== undefined && { end_date: new Date(end_date) }),
        ...(venue !== undefined && { venue: String(venue) }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(cover_image_url !== undefined && { cover_image_url: String(cover_image_url) })
      }
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'UPDATE',
        entity: 'events',
        entity_id: id,
        diff: { before: existing, after: updated }
      }
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.events.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.events.delete({ where: { id } });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'DELETE',
        entity: 'events',
        entity_id: id,
        diff: { before: existing, after: null }
      }
    });

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
