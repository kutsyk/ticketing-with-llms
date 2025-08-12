/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [],
  },

  env: {
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
