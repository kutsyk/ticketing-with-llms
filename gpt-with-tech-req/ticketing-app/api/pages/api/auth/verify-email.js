// pages/api/auth/verify-email.js
import prisma from '../../../lib/db/client';
import { verifyToken } from '../../../lib/auth/jwt';

/**
 * @openapi
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify a user's email address
 *     description: Validates the verification token sent via email and marks the user's email as verified.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token received in email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Missing or invalid token
 *       404:
 *         description: User not found
 *       410:
 *         description: Token expired
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  if (!payload || !payload.id || payload.type !== 'verify_email') {
    return res.status(400).json({ error: 'Invalid verification token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email_verified_at: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.email_verified_at) {
    return res.status(200).json({ message: 'Email already verified' });
  }

  await prisma.user.update({
    where: { id: payload.id },
    data: { email_verified_at: new Date() },
  });

  return res.status(200).json({ message: 'Email verified successfully' });
}
