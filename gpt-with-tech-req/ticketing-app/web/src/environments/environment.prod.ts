export const environment = {
  production: true,

  /**
   * Base URL for the API.
   * In production, replace with your actual deployed API endpoint.
   */
  apiBaseUrl: 'https://api.yourdomain.com/api',

  /**
   * OAuth settings
   */
  oauth: {
    google: {
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      redirectUri: 'https://yourdomain.com/auth/google/callback'
    }
  },

  /**
   * Stripe public key for client-side payments
   */
  stripe: {
    publicKey: 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX'
  },

  /**
   * QR scanner configuration
   */
  qr: {
    cameraFacingMode: 'environment',
    scanDelay: 500
  }
};
