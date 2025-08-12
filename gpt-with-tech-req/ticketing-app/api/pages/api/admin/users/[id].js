// pages/api/admin/users/[id].js

import prisma from '../../../../../lib/db/client.js';
import { verifyToken } from '../../../../../lib/auth/jwt.js';
import { hashPassword } from '../../../../../lib/auth/hash.js';

function scrub(user) {
  if (!user) return user;
  const { password_hash, ...rest } = user;
  return rest;
}

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a single user (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: The user object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update a user (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               email_verified_at:
 *                 type: string
 *                 format: date-time
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a user (ADMIN only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's ID
 *     responses:
 *       204:
 *         description: User deleted
 *       400:
 *         description: Cannot delete yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        email_verified_at: true,
        avatar_url: true
      }
    });
    return user ? res.json(user) : res.status(404).json({ error: 'Not found' });
  }

  if (req.method === 'PATCH') {
    const { email, name, role, avatar_url, email_verified_at, password } = req.body || {};
    const data = {};
    if (email !== undefined) data.email = String(email);
    if (name !== undefined) data.name = String(name);
    if (role !== undefined) data.role = String(role).toUpperCase();
    if (avatar_url !== undefined) data.avatar_url = String(avatar_url);
    if (email_verified_at !== undefined) {
      data.email_verified_at = email_verified_at ? new Date(email_verified_at) : null;
    }
    if (password) data.password_hash = await hashPassword(String(password));

    if (me.id === id && data.role && data.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'Not found' });

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
        email_verified_at: true,
        avatar_url: true
      }
    });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'UPDATE',
        entity: 'users',
        entity_id: id,
        diff: { before: scrub(before), after: updated }
      }
    });

    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    if (me.id === id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.user.delete({ where: { id } });

    await prisma.audit_logs.create({
      data: {
        actor_user_id: me.id,
        action: 'DELETE',
        entity: 'users',
        entity_id: id,
        diff: { before: scrub(existing), after: null }
      }
    });

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
