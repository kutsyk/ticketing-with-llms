// pages/api/auth/reset-password.js
import prisma from '../../../lib/db/client';
import { verifyToken } from '../../../lib/auth/jwt';
import { hashPassword } from '../../../lib/auth/hash';

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the user password using a token sent via email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *               password:
 *                 type: string
 *                 example: NewStrongPass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password } = req.body || {};

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (!payload || payload.type !== 'reset_password') {
    return res.status(401).json({ error: 'Invalid token type' });
  }

  const user = await prisma.users.findUnique({ where: { id: payload.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const password_hash = await hashPassword(password);
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash },
  });

  return res.status(200).json({ message: 'Password reset successful' });
}
