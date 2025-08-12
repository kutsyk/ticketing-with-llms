// web/src/app/core/utils/jwt.ts

/**
 * Decode a JWT without verifying it.
 * Useful for reading claims on the frontend.
 */
export function decodeToken(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    return JSON.parse(atob(payload));
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT is expired.
 * @param token - JWT string
 * @returns boolean
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const expiry = decoded.exp * 1000; // convert seconds to milliseconds
  return Date.now() >= expiry;
}

/**
 * Get expiration date of a JWT.
 * @param token - JWT string
 * @returns Date | null
 */
export function getTokenExpirationDate(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}
