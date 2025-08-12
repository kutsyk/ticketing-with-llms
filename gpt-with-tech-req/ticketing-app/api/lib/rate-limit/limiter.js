// lib/rate-limit/limiter.js
// Centralized rate-limiting middleware using express-rate-limit

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

/**
 * Create a rate limiter middleware.
 * Can use in-memory or Redis backend (if REDIS_URL is set).
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in ms
 * @param {number} options.max - Max number of requests in window
 * @param {string} [options.message] - Optional custom error message
 */
export function createRateLimiter({ windowMs, max, message }) {
  const useRedis = Boolean(process.env.REDIS_URL);

  let store;
  if (useRedis) {
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    store = new RedisStore({
      sendCommand: (...args) => client.call(...args),
    });
  }

  return rateLimit({
    windowMs,
    max,
    store,
    standardHeaders: true, // Send rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: message || 'Too many requests, please try again later.',
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        error: options.message || 'Too many requests',
      });
    },
  });
}

/**
 * Example specific limiters for different use cases
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login/signup attempts. Please try again later.',
});

export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
});

export default {
  createRateLimiter,
  authLimiter,
  generalLimiter,
};
