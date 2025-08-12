// pages/api/auth/me.js
import prisma from '../../../lib/db/client';
import { verifyToken } from '../../../lib/auth/jwt';

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 2a4f1b35-7f68-4f82-84c4-6f942d2fba2d
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 role:
 *                   type: string
 *                   example: USER
 *                 email_verified_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 avatar_url:
 *                   type: string
 *                   example: https://example.com/avatar.jpg
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract bearer token from Authorization header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify token
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      email_verified_at: true,
      avatar_url: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(user);
}
