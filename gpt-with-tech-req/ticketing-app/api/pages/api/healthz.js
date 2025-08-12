// pages/api/healthz.js
import prisma from '../../lib/db/client';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * @openapi
 * /api/healthz:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the API and database connection.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 db:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Service unavailable
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let dbStatus = 'disconnected';
  try {
    // Minimal DB query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  if (dbStatus !== 'connected') {
    return res.status(503).json({
      status: 'error',
      db: dbStatus,
    });
  }

  return res.status(200).json({
    status: 'ok',
    db: dbStatus,
  });
}
