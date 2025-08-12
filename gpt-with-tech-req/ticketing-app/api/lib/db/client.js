// lib/db/client.js
// Prisma Client singleton to avoid hot-reload multiple instances in dev mode

import { PrismaClient } from '@prisma/client';

let prisma;

/**
 * Ensure we don't create multiple PrismaClient instances in dev.
 * In production, a single instance is created per lambda/container lifecycle.
 */
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // Enable detailed logging in dev if needed
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    });
  }
  // @ts-ignore
  prisma = global.prisma;
}

export default prisma;
