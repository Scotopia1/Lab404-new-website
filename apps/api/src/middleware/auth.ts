import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import type { AuthUser, UserRole } from '@lab404/shared-types';
import { sessionService } from '../services/session.service';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  customerId?: string;
  sessionId?: string;
}

/**
 * Extract JWT token from cookies or Authorization header
 * Prioritizes httpOnly cookie over Bearer token (for migration)
 */
function extractToken(req: Request): string | null {
  // Try cookie first (secure, httpOnly)
  const cookieToken = req.cookies?.['auth_token'];
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Bearer header (temporary, for backward compatibility)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Verify JWT token and return payload
 */
function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Optional authentication middleware
 * Sets req.user if valid token is present, but doesn't require it
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = verifyToken(token);

      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        customerId: payload.customerId,
        sessionId: payload.sessionId,
      };
    }

    // Also check for session ID (for guest carts)
    const sessionId = req.headers['x-session-id'] as string | undefined;
    if (sessionId) {
      req.sessionId = sessionId;
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Required authentication middleware
 * Throws UnauthorizedError if no valid token is present
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyToken(token);

    // Validate session if sessionId present
    if (payload.sessionId) {
      const session = await sessionService.validateSession(payload.sessionId);

      if (!session) {
        throw new UnauthorizedError('Session not found or expired');
      }

      if (!session.isActive) {
        throw new UnauthorizedError('Session has been revoked');
      }

      // Update activity (async, non-blocking)
      sessionService.updateActivity(session.id).catch((err) =>
        logger.error('Failed to update session activity', { sessionId: session.id, error: err })
      );
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      customerId: payload.customerId,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Admin authorization middleware
 * Must be used after requireAuth
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(): Date {
  const expiresIn = config.jwtExpiresIn;
  const ms = parseDuration(expiresIn);
  return new Date(Date.now() + ms);
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  }

  const value = parseInt(match[1] || '0', 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
