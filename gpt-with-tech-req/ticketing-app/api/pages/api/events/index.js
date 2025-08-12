// pages/api/events/index.js

import prisma from '../../../lib/db/client.js';
import { verifyToken } from '../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: List all events
 *     description: Returns a paginated list of events, optionally filtered by search query.
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term for event name or description.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip.
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *
 *   post:
 *     summary: Create a new event
 *     description: Creates a new event (requires ADMIN role).
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventCreate'
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return listEvents(req, res);
  }
  if (req.method === 'POST') {
    return createEvent(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function listEvents(req, res) {
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
      orderBy: { starts_at: 'asc' }
    }),
    prisma.event.count({ where })
  ]);

  return res.status(200).json({ total, limit: take, offset: skip, items });
}

async function createEvent(req, res) {
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

  const { name, description, location, start_time, end_time } = req.body || {};
  if (!name || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const event = await prisma.event.create({
    data: {
      name: String(name),
      description: description ? String(description) : null,
      location: location ? String(location) : null,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      created_by_user_id: me.id
    }
  });

  return res.status(201).json(event);
}
