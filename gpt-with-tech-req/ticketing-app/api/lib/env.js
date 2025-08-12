// lib/env.js
// Centralized environment variable loader and validator
// Ensures required env vars are present and properly typed

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if present
dotenv.config();

// Define validation schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/, { message: 'PORT must be a number' })
    .default('3000'),

  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters long' }),

  REDIS_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .regex(/^\d+$/, { message: 'SMTP_PORT must be a number' })
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  BASE_URL: z.string().url().default('http://localhost:3000'),

  // Optional flags
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  parsed.error.errors.forEach((err) => {
    console.error(` - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  SMTP_PORT: parsed.data.SMTP_PORT
    ? parseInt(parsed.data.SMTP_PORT, 10)
    : undefined,
};

export default env;
