import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param length Length of the token in bytes (default 32 = 64 hex chars)
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a short secure token (for URLs)
 * @param length Length of the token in bytes (default 24 = 48 hex chars)
 */
export function generateShortToken(length = 24): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a token using SHA256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a URL-safe base64 token
 */
export function generateUrlSafeToken(length = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}
