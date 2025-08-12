// lib/auth/rbac.js
// Role-based access control helpers for Next.js API routes

import { verifyToken } from './jwt.js';

export const Roles = /** @type {const} */ ({
  USER: 'USER',
  SELLER: 'SELLER',
  CHECKER: 'CHECKER',
  ADMIN: 'ADMIN'
});

/**
 * Safely extract the Bearer token from the Authorization header
 * @param {import('next').NextApiRequest} req
 */
function getBearer(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

/**
 * Attach req.user if Authorization bearer token is present and valid.
 * Returns { ok, user?, error? } and DOES NOT end the response.
 * @param {import('next').NextApiRequest} req
 */
export function tryAuthenticate(req) {
  const token = getBearer(req);
  if (!token) return { ok: false, error: 'Missing token' };
  try {
    const user = verifyToken(token);
    // @ts-ignore - augment request at runtime
    req.user = user;
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: e?.message || 'Invalid token' };
  }
}

/**
 * Require authentication. If invalid, responds 401 and returns true (handled).
 * If valid, attaches req.user and returns false (not handled).
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export function requireAuth(req, res) {
  const token = getBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  try {
    const user = verifyToken(token);
    // @ts-ignore
    req.user = user;
    return false;
  } catch (e) {
    res.status(401).json({ error: e?.message || 'Unauthorized' });
    return true;
  }
}

/**
 * Check if a user has at least one of the required roles.
 * @param {{ role?: string }|null|undefined} user
 * @param {string[]} allowed
 */
export function hasRole(user, ...allowed) {
  if (!user || !user.role) return false;
  return allowed.includes(String(user.role).toUpperCase());
}

/**
 * Require any of the roles. Sends 403 if the authenticated user lacks permission.
 * Assumes authentication has already been enforced (use with requireAuth or withGuard).
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 * @param {string[]} allowed
 * @returns {boolean} true if response has been handled (denied), false if allowed to proceed
 */
export function requireRoles(req, res, ...allowed) {
  // @ts-ignore
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  if (!hasRole(user, ...allowed)) {
    res.status(403).json({ error: 'Forbidden' });
    return true;
  }
  return false;
}

/**
 * Higher-order guard that enforces auth and roles before calling the handler.
 * Usage:
 *   export default withGuard([Roles.ADMIN], async (req, res) => { ... })
 *
 * @param {string[]|null} roles - roles allowed; pass null to enforce auth-only
 * @param {(req: import('next').NextApiRequest, res: import('next').NextApiResponse) => any|Promise<any>} handler
 */
export function withGuard(roles, handler) {
  return async function guarded(req, res) {
    if (requireAuth(req, res)) return; // 401 if needed
    if (Array.isArray(roles) && roles.length > 0) {
      if (requireRoles(req, res, ...roles)) return; // 403 if needed
    }
    return handler(req, res);
  };
}

/**
 * Optional-auth wrapper: attaches req.user when present & valid, but does not require it.
 * Useful for public endpoints that behave differently when a user is logged in.
 *
 * @param {(req: import('next').NextApiRequest, res: import('next').NextApiResponse) => any|Promise<any>} handler
 */
export function withOptionalAuth(handler) {
  return async function optional(req, res) {
    tryAuthenticate(req); // ignores errors, does not send response
    return handler(req, res);
  };
}

// -------------------- Capability helpers (policies) --------------------

/** @param {{role?: string}} u */
export const isAdmin = (u) => hasRole(u, Roles.ADMIN);
/** @param {{role?: string}} u */
export const canSell = (u) => hasRole(u, Roles.SELLER, Roles.ADMIN);
/** @param {{role?: string}} u */
export const canCheck = (u) => hasRole(u, Roles.CHECKER, Roles.SELLER, Roles.ADMIN);
/** @param {{role?: string}} u */
export const isUser = (u) => hasRole(u, Roles.USER, Roles.SELLER, Roles.CHECKER, Roles.ADMIN);

/**
 * Owner-or-admin policy: returns true if the acting user is ADMIN or owns the resource.
 * @param {{id?: string, role?: string}} actingUser - decoded JWT payload
 * @param {string|null|undefined} resourceUserId - the owner id of the resource
 */
export function isOwnerOrAdmin(actingUser, resourceUserId) {
  if (!actingUser) return false;
  if (isAdmin(actingUser)) return true;
  return actingUser.id && resourceUserId && String(actingUser.id) === String(resourceUserId);
}

// -------------------- Examples / Patterns --------------------
// Example for an ADMIN-only route:
//
//   import { withGuard, Roles } from '../../../lib/auth/rbac';
//   export default withGuard([Roles.ADMIN], async (req, res) => {
//     // req.user is available here
//     res.json({ ok: true });
//   });
//
// Example for auth-only (any logged-in role):
//
//   export default withGuard(null, async (req, res) => {
//     res.json({ me: req.user });
//   });
//
// Example for optional auth:
//
//   export default withOptionalAuth(async (req, res) => {
//     const me = req.user || null;
//     res.json({ greeting: me ? `Hi ${me.email}` : 'Hello, guest' });
//   });
