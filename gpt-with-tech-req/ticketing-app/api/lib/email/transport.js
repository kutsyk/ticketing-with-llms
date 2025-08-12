// lib/email/transport.js
import nodemailer from 'nodemailer';

/**
 * Create a reusable email transport instance
 * Uses SMTP configuration from environment variables.
 * Defaults to MailHog in development.
 */
export function createTransport() {
  const isDev = process.env.NODE_ENV !== 'production';

  // Default dev transport (MailHog at :1025)
  if (isDev && !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: 'mailhog',
      port: 1025,
      secure: false,
      auth: null
    });
  }

  // Production or custom SMTP config
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

/**
 * Send an email using configured transport
 * @param {Object} options - Mail options (to, subject, html, text)
 */
export async function sendEmail(options) {
  const transporter = createTransport();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    ...options
  });
}
