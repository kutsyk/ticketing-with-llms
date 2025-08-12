import bcrypt from 'bcrypt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * Hash a plain-text password
 * @param {string} password - The plain-text password
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a hashed password
 * @param {string} password - The plain-text password
 * @param {string} hashed - The stored hashed password
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export async function verifyPassword(password, hashed) {
  if (!password || !hashed) {
    return false;
  }
  return bcrypt.compare(password, hashed);
}
