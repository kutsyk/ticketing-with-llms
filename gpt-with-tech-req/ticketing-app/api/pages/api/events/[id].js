// pages/api/events/[id].js

import prisma from '../../../lib/db/client.js';
import { verifyToken } from '../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *
 *   patch:
 *     summary: Update event
 *     description: Updates an existing event. Requires ADMIN role.
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Updated event
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *
 *   delete:
 *     summary: Delete event
 *     description: Deletes an event by ID. Requires ADMIN role.
 *     tags:
 *       - Events
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
  if (req.method === 'GET') return getEvent(req, res);
  if (req.method === 'PATCH') return updateEvent(req, res);
  if (req.method === 'DELETE') return deleteEvent(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getEvent(req, res) {
  const { id } = req.query;
  const event = await prisma.events.findUnique({ where: { id } });
  if (!event) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json(event);
}

async function updateEvent(req, res) {
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
  if (me.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const existing = await prisma.events.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { name, description, location, start_time, end_time } = req.body || {};
  const data = {};
  if (name !== undefined) data.name = String(name);
  if (description !== undefined) data.description = String(description);
  if (location !== undefined) data.location = String(location);
  if (start_time !== undefined) data.start_time = new Date(start_time);
  if (end_time !== undefined) data.end_time = new Date(end_time);

  const updated = await prisma.events.update({ where: { id }, data });
  return res.status(200).json(updated);
}

async function deleteEvent(req, res) {
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
  if (me.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const existing = await prisma.events.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  await prisma.events.delete({ where: { id } });
  return res.status(204).end();
}
