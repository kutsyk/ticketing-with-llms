import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for a user object
 * @param {Object} user - The user object from DB
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  if (!user || !user.id) {
    throw new Error('Cannot generate token without user id');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify a JWT token and return decoded payload
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * Extract and verify token from Authorization header
 * @param {import('next').NextApiRequest} req
 * @returns {Object} Decoded payload
 */
export function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw new Error('Unauthorized');
  }

  return verifyToken(token);
}
