// pages/api/admin/exports/index.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';
import { exportToCSV } from '../../../../lib/exports/csv.js';

/**
 * @openapi
 * /api/admin/exports:
 *   get:
 *     summary: Export entity data to CSV (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [users, events, tickets, payments]
 *         required: true
 *         description: Entity to export
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term for filtering results
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *           maximum: 10000
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { entity, q = '', limit = '1000', offset = '0' } = req.query;

  if (!entity || !['users', 'events', 'tickets', 'payments'].includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity' });
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 1000, 1), 10000);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const where = {};
  if (q) {
    if (entity === 'users') {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } }
      ];
    } else if (entity === 'events') {
      where.name = { contains: q, mode: 'insensitive' };
    } else if (entity === 'tickets') {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    } else if (entity === 'payments') {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }
  }

  let data = [];
  if (entity === 'users') {
    data = await prisma.users.findMany({
      where,
      take,
      skip,
      select: { id: true, email: true, name: true, role: true, created_at: true, updated_at: true }
    });
  } else if (entity === 'events') {
    data = await prisma.events.findMany({
      where,
      take,
      skip,
      select: { id: true, name: true, description: true, starts_at: true, ends_at: true, created_at: true }
    });
  } else if (entity === 'tickets') {
    data = await prisma.tickets.findMany({
      where,
      take,
      skip,
      select: { id: true, user_id: true, event_id: true, issued_at: true, validated_at: true }
    });
  } else if (entity === 'payments') {
    data = await prisma.payments.findMany({
      where,
      take,
      skip,
      select: { id: true, user_id: true, event_id: true, amount: true, currency: true, status: true, created_at: true }
    });
  }

  const csv = exportToCSV(data);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${entity}-export.csv`);
  res.status(200).send(csv);
}
