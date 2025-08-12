// pages/api/checker/validate.js

import { verifyToken } from '../../../lib/auth/jwt.js';
import { validateTicket } from '../../../lib/tickets/validate.js';

/**
 * @openapi
 * /api/checker/validate:
 *   post:
 *     summary: Validate a ticket (checker access)
 *     description: Validates a ticket using its ticketId or QR code payload. Accessible to CHECKER, STAFF, or ADMIN roles.
 *     tags:
 *       - Checker
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: string
 *                 description: Ticket ID
 *               qrPayload:
 *                 type: string
 *                 description: QR code payload
 *     responses:
 *       200:
 *         description: Ticket validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Only ADMIN, STAFF, or CHECKER can validate tickets here
  if (!['ADMIN', 'STAFF', 'CHECKER'].includes(me.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { ticketId, qrPayload } = req.body || {};
  if (!ticketId && !qrPayload) {
    return res.status(400).json({ error: 'ticketId or qrPayload is required' });
  }

  try {
    const result = await validateTicket({ ticketId, qrPayload });
    if (!result) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    return res.status(200).json({
      valid: result.valid,
      ticket: result.ticket,
      message: result.message
    });
  } catch (err) {
    console.error('Error validating ticket (checker):', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
