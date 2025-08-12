// lib/tickets/issue.js
// Issue a ticket for an event/order, persist in DB, generate QR, and optionally send email.

import prisma from '../db/client.js';
import { createTicketPayload, buildQrText } from '../qr/payload.js';
import { generateQrPng } from '../qr/generate.js';
import { sendEmail } from '../email/transport.js';
import fs from 'fs';
import path from 'path';

/**
 * Issue a new ticket for a given order item.
 * @param {Object} params
 * @param {string} params.orderId - Associated order ID
 * @param {string} params.eventId - Event ID
 * @param {string} params.userId - Owner's user ID
 * @param {boolean} [params.useJwt=false] - Whether to use JWT payload instead of opaque token
 * @param {boolean} [params.sendEmailToUser=true] - Whether to email the ticket to the user
 * @returns {Promise<Object>} Created ticket record
 */
export async function issueTicket({
  orderId,
  eventId,
  userId,
  useJwt = false,
  sendEmailToUser = true
}) {
  if (!orderId || !eventId || !userId) {
    throw new Error('orderId, eventId, and userId are required');
  }

  // Create secure payload (opaque token or JWT)
  const { tokenOrJwt, version, kind } = createTicketPayload({
    ticketId: cryptoRandomId(),
    useJwt,
    version: 1
  });

  // Store in DB (with hashed token if opaque)
  const ticket = await prisma.ticket.create({
    data: {
      id: cryptoRandomId(),
      order_id: orderId,
      event_id: eventId,
      user_id: userId,
      qr_token: kind === 'opaque' ? tokenOrJwt : null,
      qr_jwt: kind === 'jwt' ? tokenOrJwt : null,
      qr_version: version,
      status: 'ISSUED'
    }
  });

  // Build QR code text and image
  const qrText = buildQrText({ data: tokenOrJwt, version });
  const qrPngBuffer = await generateQrPng(qrText);

  // Optionally send ticket email
  if (sendEmailToUser) {
    await sendTicketEmail({ userId, ticket, qrPngBuffer });
  }

  return ticket;
}

/**
 * Send a ticket email with QR code attached.
 * @param {Object} params
 * @param {string} params.userId
 * @param {Object} params.ticket
 * @param {Buffer} params.qrPngBuffer
 */
async function sendTicketEmail({ userId, ticket, qrPngBuffer }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  });
  if (!user) {
    throw new Error(`User ${userId} not found for ticket ${ticket.id}`);
  }

  const templateHtml = loadEmailTemplate('ticket-delivery.mjml');
  const htmlContent = templateHtml
    .replace(/{{NAME}}/g, user.name || 'Customer')
    .replace(/{{EVENT_ID}}/g, ticket.event_id)
    .replace(/{{TICKET_ID}}/g, ticket.id);

  await sendEmail({
    to: user.email,
    subject: `Your ticket for event ${ticket.event_id}`,
    html: htmlContent,
    attachments: [
      {
        filename: `ticket-${ticket.id}.png`,
        content: qrPngBuffer
      }
    ]
  });
}

/**
 * Load an MJML template from /templates/emails and compile it to HTML.
 * @param {string} filename
 */
function loadEmailTemplate(filename) {
  const filePath = path.join(process.cwd(), 'templates', 'emails', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Generate a cryptographically random 16-byte ID in hex.
 * Used for ticket IDs when not relying on DB autogen.
 */
function cryptoRandomId() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');
}
