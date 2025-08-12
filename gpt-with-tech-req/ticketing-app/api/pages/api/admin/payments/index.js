// pages/api/admin/payments/index.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     summary: List all payments (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by payment ID, user email, or event name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED, REFUNDED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated list of payments
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
 *                     $ref: '#/components/schemas/Payment'
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

  const { q = '', status, limit = '20', offset = '0' } = req.query;

  const where = {};
  if (q) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { event: { name: { contains: q, mode: 'insensitive' } } }
    ];
  }
  if (status) {
    where.status = String(status).toUpperCase();
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.payments.findMany({
      where,
      take,
      skip,
      include: {
        user: { select: { id: true, email: true, name: true } },
        event: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    }),
    prisma.payments.count({ where })
  ]);

  res.json({
    total,
    limit: take,
    offset: skip,
    items
  });
}
