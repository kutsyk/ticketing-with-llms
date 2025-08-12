// pages/api/admin/dashboard/stats.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';

/**
 * @openapi
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalEvents:
 *                   type: integer
 *                 totalTickets:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                   format: float
 *                 recentEvents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       starts_at:
 *                         type: string
 *                         format: date-time
 *                       ends_at:
 *                         type: string
 *                         format: date-time
 *                       ticketsSold:
 *                         type: integer
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

  const [totalUsers, totalEvents, totalTickets, payments, recentEventsRaw] =
    await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCEEDED' }
      }),
      prisma.event.findMany({
        orderBy: { starts_at: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          starts_at: true,
          ends_at: true,
          tickets: { select: { id: true } }
        }
      })
    ]);

  const recentEvents = recentEventsRaw.map(ev => ({
    id: ev.id,
    name: ev.name,
    starts_at: ev.starts_at,
    ends_at: ev.ends_at,
    ticketsSold: ev.tickets.length
  }));

  res.status(200).json({
    totalUsers,
    totalEvents,
    totalTickets,
    totalRevenue: payments._sum.amount || 0,
    recentEvents
  });
}
