// pages/api/auth/oauth/google/start.js

/**
 * @openapi
 * /api/auth/oauth/google/start:
 *   get:
 *     summary: Start Google OAuth2 login
 *     description: Redirects the user to Google's OAuth2 authorization URL.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth2 consent screen
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔒 OAuth credentials - set these in your .env file before enabling
  // const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  // const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  // if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
  //   return res.status(500).json({ error: 'Google OAuth is not configured' });
  // }

  // const params = new URLSearchParams({
  //   client_id: GOOGLE_CLIENT_ID,
  //   redirect_uri: GOOGLE_REDIRECT_URI,
  //   response_type: 'code',
  //   scope: 'openid email profile',
  //   access_type: 'offline',
  //   prompt: 'consent'
  // });

  // const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  // return res.redirect(302, googleAuthUrl);

  return res.status(503).json({
    message:
      'Google OAuth is currently disabled. Uncomment and configure GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in your .env to enable.'
  });
}
