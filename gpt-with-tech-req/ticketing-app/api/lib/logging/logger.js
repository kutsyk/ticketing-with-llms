// lib/logging/logger.js
// Centralized logging utility using Winston

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston log format
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

/**
 * Express/Next.js request logger middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
}

/**
 * Log an error with optional context
 * @param {Error|string} error - Error instance or message
 * @param {Object} [context] - Optional additional data
 */
export function logError(error, context = {}) {
  if (error instanceof Error) {
    logger.error(error.stack || error.message, { context });
  } else {
    logger.error(String(error), { context });
  }
}

/**
 * Log a warning message
 * @param {string} message - Warning text
 * @param {Object} [context] - Optional additional data
 */
export function logWarning(message, context = {}) {
  logger.warn(message, { context });
}

/**
 * Log an info message
 * @param {string} message - Info text
 * @param {Object} [context] - Optional additional data
 */
export function logInfo(message, context = {}) {
  logger.info(message, { context });
}

export default logger;
