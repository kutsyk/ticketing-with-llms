// pages/api/tickets/[id]/resend-email.js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';
import { resendTicketEmail } from '../../../../lib/tickets/resend.js';

/**
 * @openapi
 * /api/tickets/{id}/resend-email:
 *   post:
 *     summary: Resend ticket email
 *     description: Allows a ticket owner or an admin to re-send the ticket email to the ticket's email address.
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email re-sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Email sending failed
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Retrieve ticket with event info
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { event: true, ticket_type: true }
  });

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (me.role !== 'ADMIN' && ticket.user_id !== me.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await resendTicketEmail(ticket);
    return res.status(200).json({ message: 'Ticket email resent successfully' });
  } catch (err) {
    console.error('Error resending ticket email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
