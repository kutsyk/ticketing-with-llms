// lib/tickets/resend.js
// Re-send a ticket to its purchaser's email, with fresh QR and ICS attachment.
// Requires ADMIN role or owner access.

import prisma from '../db/client.js';
import { sendEmail } from '../email/send.js';
import { generateTicketQr } from '../qr/generate.js';
import ics from 'ics';

/**
 * Resend a ticket email with QR and calendar invite.
 * @param {Object} p
 * @param {string} p.ticketId - Ticket ID
 * @param {string} p.requesterUserId - User performing the resend
 * @param {string} p.requesterRole - Role of the requester (ADMIN or USER)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function resendTicket({ ticketId, requesterUserId, requesterRole }) {
  if (!ticketId) return { success: false, error: 'ticketId required' };

  // Lookup ticket + purchaser
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      ticket_type: {
        include: {
          event: true
        }
      },
      user: true
    }
  });

  if (!ticket) {
    return { success: false, error: 'Ticket not found' };
  }

  // Permission check
  if (requesterRole !== 'ADMIN' && ticket.user_id !== requesterUserId) {
    return { success: false, error: 'Forbidden' };
  }

  if (!ticket.user?.email) {
    return { success: false, error: 'Purchaser has no email' };
  }

  // Generate QR code (as PNG buffer)
  const qrPng = await generateTicketQr(ticket, { format: 'png' });

  // Create ICS calendar invite for the event
  const event = ticket.ticket_type?.event;
  let icsFile;
  if (event) {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time || startDate.getTime() + 2 * 60 * 60 * 1000); // default 2h
    const icsData = {
      title: event.name,
      description: event.description || '',
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes()
      ],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes()
      ],
      location: event.location || '',
      url: event.url || '',
      organizer: { name: 'Ticketing', email: process.env.EMAIL_FROM || 'no-reply@example.com' }
    };
    const { error, value } = ics.createEvent(icsData);
    if (!error) {
      icsFile = Buffer.from(value, 'utf-8');
    }
  }

  // Send the email
  await sendEmail({
    to: ticket.user.email,
    subject: `Your ticket for ${event?.name || 'our event'}`,
    html: `
      <p>Hello ${ticket.user.name || ''},</p>
      <p>Here is your ticket for <strong>${event?.name || 'the event'}</strong>.</p>
      <p>Please present the attached QR code at the venue.</p>
    `,
    attachments: [
      {
        filename: `ticket-${ticket.serial || ticket.id}.png`,
        content: qrPng
      },
      ...(icsFile
        ? [
            {
              filename: `event-${event?.id || 'ticket'}.ics`,
              content: icsFile
            }
          ]
        : [])
    ]
  });

  return { success: true };
}
