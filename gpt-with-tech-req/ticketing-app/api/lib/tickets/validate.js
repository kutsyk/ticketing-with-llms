// lib/tickets/validate.js
// Validate (and optionally consume) a ticket QR, with atomic state transition and scan logging.
// Returns one of: 'valid_unused' | 'already_used' | 'invalid' | 'expired' | 'revoked'.
// On first valid scan, transitions ISSUED -> USED (terminal).

import prisma from '../db/client.js';
import { normalizeFromQrText } from '../qr/payload.js';

/** Response status union */
export const ValidationStatus = /** @type {const} */ ({
  VALID_UNUSED: 'valid_unused',
  ALREADY_USED: 'already_used',
  INVALID: 'invalid',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
});

/**
 * Normalize a Prisma Ticket into a safe payload for API responses.
 */
function toTicketPayload(t) {
  if (!t) return null;
  return {
    id: t.id,
    serial: t.serial,
    status: t.status,
    issued_at: t.issued_at,
    used_at: t.used_at,
    expires_at: t.expires_at,
    qr_version: t.qr_version,
    event_id: t.ticket_type?.event_id ?? null,
    ticket_type_id: t.ticket_type_id,
    user_id: t.user_id,
    purchaser_name: t.purchaser_name
  };
}

/**
 * Validate and optionally consume a ticket from a scanned QR text.
 *
 * @param {Object} p
 * @param {string} p.qrText
 * @param {string} p.scannedByUserId
 * @param {string} [p.userAgent]
 * @param {string} [p.ip]
 * @param {boolean} [p.consume=true]
 * @returns {Promise<{ status: typeof ValidationStatus[keyof typeof ValidationStatus], ticket?: any }>}
 */
export async function validateAndConsume({ qrText, scannedByUserId, userAgent, ip, consume = true }) {
  if (!qrText || typeof qrText !== 'string') {
    return { status: ValidationStatus.INVALID };
  }
  if (!scannedByUserId) {
    throw new Error('scannedByUserId is required');
  }

  // 1) Parse & normalize QR payload (throws on invalid/expired JWT)
  let norm;
  try {
    norm = normalizeFromQrText(qrText); // { version, kind: 'jwt'|'opaque', token?|jwt?, decoded? }
  } catch {
    await logScan(null, scannedByUserId, 'INVALID', userAgent, ip);
    return { status: ValidationStatus.INVALID };
  }

  // 2) Locate ticket
  let ticket = null;
  if (norm.kind === 'opaque' && norm.token) {
    ticket = await prisma.ticket.findFirst({
      where: { qr_token: norm.token },
      include: { ticket_type: { select: { event_id: true } } }
    });
  } else if (norm.kind === 'jwt' && norm.decoded?.sub) {
    ticket = await prisma.ticket.findUnique({
      where: { id: String(norm.decoded.sub) },
      include: { ticket_type: { select: { event_id: true } } }
    });
    if (ticket && Number.isFinite(norm.version) && ticket.qr_version !== norm.version) {
      await logScan(ticket.id, scannedByUserId, 'INVALID', userAgent, ip);
      return { status: ValidationStatus.INVALID };
    }
  }

  if (!ticket) {
    await logScan(null, scannedByUserId, 'INVALID', userAgent, ip);
    return { status: ValidationStatus.INVALID };
  }

  // 3) Expiry & status guards
  const now = new Date();
  if (ticket.expires_at && ticket.expires_at <= now) {
    await logScan(ticket.id, scannedByUserId, 'EXPIRED', userAgent, ip);
    return { status: ValidationStatus.EXPIRED, ticket: toTicketPayload(ticket) };
  }

  if (ticket.status === 'REVOKED' || ticket.status === 'REFUNDED') {
    await logScan(ticket.id, scannedByUserId, 'REVOKED', userAgent, ip);
    return { status: ValidationStatus.REVOKED, ticket: toTicketPayload(ticket) };
  }

  if (ticket.status === 'USED') {
    await logScan(ticket.id, scannedByUserId, 'ALREADY_USED', userAgent, ip);
    return { status: ValidationStatus.ALREADY_USED, ticket: toTicketPayload(ticket) };
  }

  if (ticket.status !== 'ISSUED') {
    await logScan(ticket.id, scannedByUserId, 'INVALID', userAgent, ip);
    return { status: ValidationStatus.INVALID };
  }

  // 4) Atomic consume
  if (consume) {
    const result = await prisma.$transaction(async (tx) => {
      const updatedCount = await tx.ticket.updateMany({
        where: { id: ticket.id, status: 'ISSUED' },
        data: { status: 'USED', used_at: now }
      });

      if (updatedCount === 1) {
        const used = await tx.ticket.findUnique({
          where: { id: ticket.id },
          include: { ticket_type: { select: { event_id: true } } }
        });

        await tx.ticketScan.create({
          data: {
            ticket_id: ticket.id,
            scanned_by_user_id: scannedByUserId,
            result: 'VALIDATED',
            user_agent: userAgent || null,
            ip_address: ip || null,
            scanned_at: now
          }
        });

        return { ok: true, used };
      }

      const current = await tx.ticket.findUnique({
        where: { id: ticket.id },
        include: { ticket_type: { select: { event_id: true } } }
      });

      await tx.ticketScan.create({
        data: {
          ticket_id: ticket.id,
          scanned_by_user_id: scannedByUserId,
          result: current?.status === 'USED' ? 'ALREADY_USED' : mapStatusToScanResult(current?.status),
          user_agent: userAgent || null,
          ip_address: ip || null,
          scanned_at: now
        }
      });

      return { ok: false, current };
    });

    if (result.ok) {
      return { status: ValidationStatus.VALID_UNUSED, ticket: toTicketPayload(result.used) };
    }

    const cur = result.current;
    if (!cur) return { status: ValidationStatus.INVALID };
    if (cur.status === 'USED') return { status: ValidationStatus.ALREADY_USED, ticket: toTicketPayload(cur) };
    if (cur.expires_at && cur.expires_at <= now) return { status: ValidationStatus.EXPIRED, ticket: toTicketPayload(cur) };
    if (cur.status === 'REVOKED' || cur.status === 'REFUNDED') return { status: ValidationStatus.REVOKED, ticket: toTicketPayload(cur) };
    return { status: ValidationStatus.INVALID, ticket: toTicketPayload(cur) };
  }

  // 5) No consume: just log and return would-be-valid
  await logScan(ticket.id, scannedByUserId, 'VALIDATED', userAgent, ip);
  return { status: ValidationStatus.VALID_UNUSED, ticket: toTicketPayload(ticket) };
}

/**
 * Create a TicketScan row (best-effort).
 */
async function logScan(ticketId, scannedByUserId, result, userAgent, ip) {
  try {
    if (!scannedByUserId || !ticketId) return;
    await prisma.ticketScan.create({
      data: {
        ticket_id: ticketId,
        scanned_by_user_id: scannedByUserId,
        result,
        user_agent: userAgent || null,
        ip_address: ip || null,
        scanned_at: new Date()
      }
    });
  } catch {
    // swallow; logging must not block validation
  }
}

function mapStatusToScanResult(status) {
  switch (status) {
    case 'REVOKED':
    case 'REFUNDED':
      return 'REVOKED';
    case 'USED':
      return 'ALREADY_USED';
    default:
      return 'INVALID';
  }
}
