// pages/api/readyz.js
import prisma from '../../lib/db/client';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * @openapi
 * /api/readyz:
 *   get:
 *     summary: Readiness check endpoint
 *     description: Returns whether the API is ready to accept traffic. Performs DB and application-level checks.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 db:
 *                   type: string
 *                   example: connected
 *                 uptime:
 *                   type: number
 *                   example: 125.42
 *       503:
 *         description: Not ready
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  const uptime = process.uptime();

  if (dbStatus !== 'connected') {
    return res.status(503).json({
      status: 'not ready',
      db: dbStatus,
      uptime,
    });
  }

  // You could add more checks here (cache, external APIs, etc.)
  return res.status(200).json({
    status: 'ready',
    db: dbStatus,
    uptime,
  });
}
