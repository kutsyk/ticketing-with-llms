// middleware/rate-limit.js
// Applies IP-based or token-based rate limiting to API routes

import limiter from '../lib/rate-limit/limiter.js';

/**
 * Wraps an API route handler with rate limiting.
 *
 * @param {Function} handler - The Next.js API route handler function.
 * @param {Object} [options] - Rate limit configuration.
 * @param {number} [options.limit=60] - Maximum requests allowed in the time window.
 * @param {number} [options.window=60] - Time window in seconds.
 * @param {string} [options.keyPrefix='rl'] - Prefix for limiter keys.
 * @returns {Function} A wrapped handler function with rate limiting.
 */
export default function withRateLimit(handler, options = {}) {
  const limit = options.limit ?? 60;
  const window = options.window ?? 60;
  const keyPrefix = options.keyPrefix ?? 'rl';

  return async (req, res) => {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      'unknown';

    const token = req.headers.authorization?.replace(/^Bearer\s+/, '');
    const key = token ? `${keyPrefix}:token:${token}` : `${keyPrefix}:ip:${ip}`;

    const { success, remaining, reset } = await limiter.check(key, limit, window);

    if (!success) {
      res.setHeader('Retry-After', Math.ceil(reset - Date.now() / 1000));
      return res.status(429).json({
        error: 'Too many requests',
        limit,
        remaining: 0,
        reset,
      });
    }

    // Pass rate limit info to downstream handlers for optional logging
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    return handler(req, res);
  };
}
