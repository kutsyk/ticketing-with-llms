// pages/api/auth/forgot-password.js
import prisma from '../../../lib/db/client';
import { signToken } from '../../../lib/auth/jwt';
import { sendEmail } from '../../../lib/email/send';
import path from 'path';
import fs from 'fs';
import mjml2html from 'mjml';

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email with a secure token.
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
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Email is required
 *       404:
 *         description: User not found
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Security measure: don't reveal if email exists
    return res.status(200).json({ message: 'If the account exists, an email will be sent' });
  }

  const token = signToken(
    { id: user.id, type: 'reset_password' },
    { expiresIn: '1h' }
  );

  const resetLink = `${process.env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  // Load and render the MJML template
  const templatePath = path.join(process.cwd(), 'templates', 'emails', 'reset-password.mjml');
  const mjmlTemplate = fs.readFileSync(templatePath, 'utf8');
  const htmlOutput = mjml2html(mjmlTemplate.replace('{{RESET_LINK}}', resetLink));

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: htmlOutput.html,
  });

  return res.status(200).json({ message: 'If the account exists, an email will be sent' });
}
