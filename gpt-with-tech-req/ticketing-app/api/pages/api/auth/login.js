// pages/api/auth/login.js
import prisma from '../../../lib/db/client';
import { verifyPassword } from '../../../lib/auth/hash';
import { signToken } from '../../../lib/auth/jwt';
import { z } from 'zod';
import rateLimit from '../../../middleware/rate-limit';

export const config = {
  api: {
    bodyParser: true,
  },
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in and get an authentication token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: USER
 *       400:
 *         description: Invalid email or password
 *       429:
 *         description: Too many requests
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  const limited = await rateLimit(req, res);
  if (limited) return;

  // Validate request body
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors });
  }
  const { email, password } = parseResult.data;

  // Find user
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  // Verify password
  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  // Create JWT
  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
  });

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
