// pages/api/admin/events/index.js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/events:
 *   get:
 *     summary: List all events (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by event name or description
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max results (default 20, max 100)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Skip number of results
 *     responses:
 *       200:
 *         description: List of events
 *   post:
 *     summary: Create a new event (ADMIN only)
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
 *               - name
 *               - start_date
 *               - end_date
 *               - venue
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
 *       201:
 *         description: Event created
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
    const { q = '', limit = '20', offset = '0' } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        take,
        skip,
        orderBy: { start_date: 'desc' }
      }),
      prisma.event.count({ where })
    ]);

    return res.json({ total, limit: take, offset: skip, items });
  }

  if (req.method === 'POST') {
    const { name, description, start_date, end_date, venue, capacity, cover_image_url } = req.body || {};

    if (!name || !start_date || !end_date || !venue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newEvent = await prisma.event.create({
      data: {
        name: String(name),
        description: description ? String(description) : null,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        venue: String(venue),
        capacity: capacity ? parseInt(capacity, 10) : null,
        cover_image_url: cover_image_url ? String(cover_image_url) : null
      }
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'CREATE',
        entity: 'events',
        entity_id: newEvent.id,
        diff: { before: null, after: newEvent }
      }
    });

    return res.status(201).json(newEvent);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
