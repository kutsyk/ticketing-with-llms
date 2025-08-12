// pages/api/admin/audit-logs/index.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/audit-logs:
 *   get:
 *     summary: List all audit logs (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by actor email, entity name, or entity ID
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., `users`, `events`)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of audit logs
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
 *                     $ref: '#/components/schemas/AuditLog'
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

  const { q = '', entity, limit = '20', offset = '0' } = req.query;
  const where = {};

  if (q) {
    where.OR = [
      { actor_user: { email: { contains: q, mode: 'insensitive' } } },
      { entity: { contains: q, mode: 'insensitive' } },
      { entity_id: { contains: q, mode: 'insensitive' } }
    ];
  }

  if (entity) {
    where.entity = entity;
  }

  const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = Math.max(parseInt(offset, 10) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      take,
      skip,
      orderBy: { created_at: 'desc' },
      include: {
        actor_user: { select: { id: true, email: true, name: true } }
      }
    }),
    prisma.audit_logs.count({ where })
  ]);

  res.json({ total, limit: take, offset: skip, items });
}
