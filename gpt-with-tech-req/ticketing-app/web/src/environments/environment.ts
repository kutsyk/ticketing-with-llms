export const environment = {
  production: false,

  /**
   * Base URL for the API.
   * For local development, points to localhost:3000 (Next.js API project).
   * Can be overridden with environment variables in Docker.
   */
  apiBaseUrl: 'http://localhost:3000/api',

  /**
   * OAuth settings
   */
  oauth: {
    google: {
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      redirectUri: 'http://localhost:4200/auth/google/callback'
    }
  },

  /**
   * Stripe public key for client-side payments
   */
  stripe: {
    publicKey: 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX'
  },

  /**
   * QR scanner configuration
   */
  qr: {
    cameraFacingMode: 'environment', // or 'user'
    scanDelay: 500 // milliseconds between scans
  }
};
