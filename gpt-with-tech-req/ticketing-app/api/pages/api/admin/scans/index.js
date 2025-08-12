// pages/api/admin/scans/index.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/scans:
 *   get:
 *     summary: List all ticket scans (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by ticket ID or user email
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of ticket scans
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
 *                     $ref: '#/components/schemas/TicketScan'
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

  const { q = '', eventId, limit = '20', offset = '0' } = req.query;
  const where = {};
  if (q) {
    where.OR = [
      { ticket_id: { contains: q, mode: 'insensitive' } },
      { ticket: { user: { email: { contains: q, mode: 'insensitive' } } } }
    ];
  }
  if (eventId) {
    where.ticket = { ...where.ticket, event_id: eventId };
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.ticket_scans.findMany({
      where,
      take,
      skip,
      orderBy: { scanned_at: 'desc' },
      include: {
        ticket: {
          select: {
            id: true,
            event: { select: { id: true, name: true } },
            user: { select: { id: true, email: true, name: true } }
          }
        },
        scanned_by_user: { select: { id: true, email: true, name: true } }
      }
    }),
    prisma.ticket_scans.count({ where })
  ]);

  return res.json({ total, limit: take, offset: skip, items });
}
