import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.JWT_SECRET || '',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
  getSessionIdentifier: (req) => {
    // Use session ID if available, otherwise use a combination of user-agent and IP
    // This is safe because the secret is used for HMAC
    return req.sessionID || `${req.headers['user-agent']}-${req.ip}`;
  },
});

// Export the CSRF functions
export { generateCsrfToken, doubleCsrfProtection };
