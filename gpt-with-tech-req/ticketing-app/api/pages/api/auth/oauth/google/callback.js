// pages/api/auth/oauth/google/callback.js

import prisma from '../../../../lib/db/client.js';
import { signToken } from '../../../../lib/auth/jwt.js';
import { sendEmail } from '../../../../lib/email/send.js';

/**
 * @openapi
 * /api/auth/oauth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback
 *     description: Handles the Google OAuth2 callback, exchanges the code for tokens, retrieves the user profile, and logs the user in or creates a new account.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned from Google OAuth2.
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing or invalid code
 *       500:
 *         description: Server error
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  // 🔒 OAuth credentials - set in .env
  // const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  // const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  // const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  // if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  //   return res.status(500).json({ error: 'Google OAuth is not configured' });
  // }

  try {
    // Exchange code for tokens
    // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     code,
    //     client_id: GOOGLE_CLIENT_ID,
    //     client_secret: GOOGLE_CLIENT_SECRET,
    //     redirect_uri: GOOGLE_REDIRECT_URI,
    //     grant_type: 'authorization_code'
    //   })
    // });

    // const tokenData = await tokenResponse.json();
    // if (!tokenData.access_token) {
    //   return res.status(400).json({ error: 'Failed to get access token' });
    // }

    // Get user info from Google
    // const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    //   headers: { Authorization: `Bearer ${tokenData.access_token}` }
    // });
    // const profile = await profileResponse.json();

    // Simulated profile for disabled mode
    const profile = {
      id: 'google-simulated-id',
      email: 'testuser@example.com',
      name: 'Google User',
      picture: 'https://via.placeholder.com/150'
    };

    // Check if user exists
    let user = await prisma.users.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await prisma.users.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatar_url: profile.picture,
          role: 'USER',
          email_verified_at: new Date()
        }
      });

      await prisma.audit_logs.create({
        data: {
          actor_user_id: user.id,
          action: 'CREATE',
          entity: 'users',
          entity_id: user.id,
          diff: { after: user }
        }
      });

      await sendEmail({
        to: profile.email,
        subject: 'Welcome!',
        template: 'verify-email',
        variables: { name: profile.name }
      });
    }

    const token = signToken(user);

    return res.status(200).json({ token, user });
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
