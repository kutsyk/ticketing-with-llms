/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow serving static assets like Swagger UI from /public
  images: {
    domains: [],
  },

  // Enable experimental features if needed
  experimental: {
    serverActions: false,
  },

  // Ensure env variables from .env are available in Next.js runtime
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || '',
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || '',
  },

  // Output directory
  output: 'standalone',

  // Allow API routes to serve large payloads
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
