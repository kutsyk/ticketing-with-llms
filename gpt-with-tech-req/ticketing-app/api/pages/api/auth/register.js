// pages/api/auth/register.js
import prisma from '../../../lib/db/client';
import { hashPassword } from '../../../lib/auth/hash';
import { z } from 'zod';
import rateLimit from '../../../middleware/rate-limit';

export const config = {
  api: {
    bodyParser: true,
  },
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
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
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   example: USER
 *       400:
 *         description: Validation error or email already registered
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
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors });
  }
  const { email, password, name } = parseResult.data;

  // Check if email is already in use
  const existing = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create new user
  const user = await prisma.users.create({
    data: {
      email: email.toLowerCase(),
      password_hash,
      name,
      role: 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return res.status(201).json(user);
}
