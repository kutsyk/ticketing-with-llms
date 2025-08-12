// pages/api/admin/payments/[id].js

import prisma from '../../../../lib/db/client.js';
import { verifyToken } from '../../../../lib/auth/jwt.js';
import { refundPayment } from '../../../../lib/payments/provider.js';

/**
 * @openapi
 * /api/admin/payments/{id}:
 *   get:
 *     summary: Get payment details (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 *   post:
 *     summary: Refund a payment (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Refund processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refunded:
 *                   type: boolean
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Refund failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let me;
  try {
    me = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (me.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'GET') {
    const payment = await prisma.payments.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        event: { select: { id: true, name: true } }
      }
    });
    if (!payment) return res.status(404).json({ error: 'Not found' });
    return res.json(payment);
  }

  if (req.method === 'POST') {
    const payment = await prisma.payments.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: 'Not found' });
    if (payment.status !== 'PAID') {
      return res.status(400).json({ error: 'Only paid payments can be refunded' });
    }

    try {
      const refundResult = await refundPayment(payment);
      const updated = await prisma.payments.update({
        where: { id },
        data: { status: 'REFUNDED', refunded_at: new Date() }
      });
      return res.json({ refunded: true, payment: updated, refundResult });
    } catch (err) {
      console.error('Refund failed:', err);
      return res.status(400).json({ error: 'Refund failed', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
