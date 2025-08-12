// lib/email/send.js
// High-level email send helpers for the Ticketing app.
// - Loads compiled HTML templates from public/emails/compiled/*.html
// - Performs minimal mustache-style rendering ({{var}} and {{#each arr}}...{{/each}})
// - Generates a plain-text fallback
// - Sends via Nodemailer transport (MailHog in dev, SMTP in prod)

import fs from 'fs';
import path from 'path';
import { sendEmail as sendWithTransport } from './transport.js';

/** Root where compiled templates live */
const TEMPLATES_ROOT = path.join(process.cwd(), 'public', 'emails', 'compiled');

/**
 * Read a compiled HTML template by filename.
 * @param {string} filename e.g., 'verify-email.html'
 * @returns {string} HTML string
 */
function readTemplate(filename) {
  const p = path.join(TEMPLATES_ROOT, filename);
  if (!fs.existsSync(p)) {
    throw new Error(`Email template not found: ${p}`);
  }
  return fs.readFileSync(p, 'utf8');
}

/**
 * Very small mustache-like renderer.
 * Supports:
 *   - {{var}}
 *   - {{#each items}} ... {{/each}}  where items is an array of objects/values
 *   - Nested props like {{user.name}} (dot access)
 * This is intentionally minimal to avoid heavy deps.
 * @param {string} tpl
 * @param {Record<string, any>} data
 */
function renderTemplate(tpl, data) {
  // 1) Handle each loops: {{#each key}}...{{/each}}
  const EACH_RE = /\{\{\#each\s+([^\}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  tpl = tpl.replace(EACH_RE, (_, key, inner) => {
    const arr = resolvePath(data, key.trim());
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr
      .map((item) => {
        // Allow {{this}} for primitives and {{this.prop}} for objects
        const scoped = { ...data, this: item };
        return renderVars(inner, scoped);
      })
      .join('');
  });

  // 2) Replace simple variables (including dot paths) e.g. {{user.name}}
  tpl = renderVars(tpl, data);

  return tpl;
}

/**
 * Replace {{var}} occurrences using data, supporting dot paths and {{this.*}}
 * @param {string} tpl
 * @param {Record<string, any>} data
 */
function renderVars(tpl, data) {
  const VAR_RE = /\{\{\s*([#\/]?)([^\}\s]+)\s*\}\}/g;
  return tpl.replace(VAR_RE, (m, control, key) => {
    // Ignore control tags (#each, /each) already handled
    if (control === '#' || control === '/') return '';
    const val = resolvePath(data, key);
    // If val is object/array, leave as JSON string for safety
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return escapeHtml(JSON.stringify(val));
    return escapeHtml(String(val));
  });
}

/**
 * Resolve a dotted path like 'user.name' or 'this.id'
 * @param {Record<string, any>} obj
 * @param {string} pathStr
 */
function resolvePath(obj, pathStr) {
  return pathStr.split('.').reduce((acc, part) => {
    if (acc == null) return undefined;
    return acc[part];
  }, obj);
}

/** Basic HTML escaping */
function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Very simple HTML → text fallback */
function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|section|br|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Send a templated email.
 * @param {Object} params
 * @param {string} params.templateFilename - e.g. 'verify-email.html'
 * @param {Record<string, any>} params.variables - template variables
 * @param {string|string[]} params.to - recipient(s)
 * @param {string} params.subject
 * @param {Array<Object>} [params.attachments] - Nodemailer attachments
 * @returns {Promise<any>}
 */
export async function sendTemplatedEmail({ templateFilename, variables, to, subject, attachments }) {
  const htmlTpl = readTemplate(templateFilename);
  const html = renderTemplate(htmlTpl, variables || {});
  const text = htmlToText(html);

  return sendWithTransport({
    to,
    subject,
    html,
    text,
    attachments
  });
}

// ------------------------------------------------------------
// Specific flows required by the spec
// ------------------------------------------------------------

/**
 * Verify Email
 * Template: public/emails/compiled/verify-email.html
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.verificationUrl
 * @param {string} params.expiresIn - e.g., "30 minutes"
 * @param {string} [params.supportUrl]
 * @param {string} [params.unsubscribeUrl]
 */
export async function sendVerifyEmail(params) {
  const year = new Date().getFullYear();
  return sendTemplatedEmail({
    templateFilename: 'verify-email.html',
    variables: {
      year,
      supportUrl: process.env.APP_SUPPORT_URL || params.supportUrl || '#',
      unsubscribeUrl: process.env.APP_UNSUBSCRIBE_URL || params.unsubscribeUrl || '#',
      ...params
    },
    to: params.to,
    subject: 'Verify your email address'
  });
}

/**
 * Reset Password
 * Template: public/emails/compiled/reset-password.html
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.resetUrl
 * @param {string} params.expiresIn
 * @param {string} [params.resetCode] - optional fallback code
 * @param {string} [params.supportUrl]
 * @param {string} [params.privacyUrl]
 * @param {string} [params.unsubscribeUrl]
 */
export async function sendResetPasswordEmail(params) {
  const year = new Date().getFullYear();
  return sendTemplatedEmail({
    templateFilename: 'reset-password.html',
    variables: {
      year,
      supportUrl: process.env.APP_SUPPORT_URL || params.supportUrl || '#',
      privacyUrl: process.env.APP_PRIVACY_URL || params.privacyUrl || '#',
      unsubscribeUrl: process.env.APP_UNSUBSCRIBE_URL || params.unsubscribeUrl || '#',
      ...params
    },
    to: params.to,
    subject: 'Reset your password'
  });
}

/**
 * Ticket Delivery
 * Template: public/emails/compiled/ticket-delivery.html
 * Supports embedding QR codes via attachments with `cid`s referenced in your template, or
 * simply provides download/account links.
 *
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.name
 * @param {string} params.eventName
 * @param {string} params.eventDate
 * @param {string} params.venue
 * @param {Array<{number:string, seat?:string, type:string, status:string, qrCid?:string}>} params.tickets
 * @param {string} params.downloadUrl
 * @param {string} params.accountUrl
 * @param {Array<Object>} [params.qrAttachments] - optional inline QR attachments [{filename, content, cid, contentType}]
 * @param {Object} [params.icsAttachment] - optional .ics attachment {filename, content, contentType:'text/calendar'}
 * @param {string} [params.supportUrl]
 * @param {string} [params.privacyUrl]
 * @param {string} [params.unsubscribeUrl]
 */
export async function sendTicketDeliveryEmail(params) {
  const year = new Date().getFullYear();
  const attachments = [];

  // Optional QR inline attachments
  if (Array.isArray(params.qrAttachments)) {
    attachments.push(...params.qrAttachments);
  }

  // Optional .ics calendar
  if (params.icsAttachment) {
    attachments.push(params.icsAttachment);
  }

  return sendTemplatedEmail({
    templateFilename: 'ticket-delivery.html',
    variables: {
      year,
      supportUrl: process.env.APP_SUPPORT_URL || params.supportUrl || '#',
      privacyUrl: process.env.APP_PRIVACY_URL || params.privacyUrl || '#',
      unsubscribeUrl: process.env.APP_UNSUBSCRIBE_URL || params.unsubscribeUrl || '#',
      ...params
    },
    to: params.to,
    subject: `Your tickets for ${params.eventName}`,
    attachments
  });
}

/**
 * Receipt / Order Confirmation
 * Template: public/emails/compiled/receipt.html
 *
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.companyName
 * @param {string} params.companyLogoUrl
 * @param {string} params.name
 * @param {string} params.orderDate
 * @param {string} params.orderNumber
 * @param {string} params.paymentMethod
 * @param {string} params.transactionId
 * @param {Array<{name:string,quantity:number,price:string,subtotal:string}>} params.items
 * @param {string} params.total
 * @param {string} params.invoiceUrl
 * @param {string} params.accountUrl
 * @param {string} params.supportUrl
 * @param {string} params.supportEmail
 * @param {string} params.privacyUrl
 * @param {string} params.unsubscribeUrl
 * @param {Array<Object>} [params.attachments] - optional attachments (e.g. PDF invoice)
 */
export async function sendReceiptEmail(params) {
  const year = new Date().getFullYear();
  return sendTemplatedEmail({
    templateFilename: 'receipt.html',
    variables: { year, ...params },
    to: params.to,
    subject: `Your receipt — ${params.orderNumber}`,
    attachments: params.attachments
  });
}

// ------------------------------------------------------------
// Helpers to easily build attachments used above
// ------------------------------------------------------------

/**
 * Build a Nodemailer inline image attachment from a data URL (e.g., QR PNG).
 * @param {Object} p
 * @param {string} p.dataUrl - like "data:image/png;base64,...."
 * @param {string} p.cid - content id to reference in HTML <img src="cid:...">
 * @param {string} [p.filename] - default "qr.png"
 */
export function buildInlineImageFromDataUrl({ dataUrl, cid, filename = 'qr.png' }) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Invalid data URL for inline image attachment');
  }
  const contentType = match[1];
  const base64 = match[2];
  return {
    filename,
    cid,
    content: Buffer.from(base64, 'base64'),
    contentType
  };
}

/**
 * Build a simple text/calendar attachment (.ics) from raw string
 * @param {Object} p
 * @param {string} p.ics
 * @param {string} [p.filename] e.g. 'event.ics'
 */
export function buildIcsAttachment({ ics, filename = 'event.ics' }) {
  return {
    filename,
    content: ics,
    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
  };
}
