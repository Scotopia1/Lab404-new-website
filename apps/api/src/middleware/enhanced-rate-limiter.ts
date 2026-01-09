import { Request, Response, NextFunction } from 'express';
import rateLimit, { Options as RateLimitOptions, RateLimitInfo } from 'express-rate-limit';
import { ipReputationService } from '../services/ip-reputation.service';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Enhanced Rate Limiter Middleware
 *
 * Features:
 * - IP reputation-based rate limiting
 * - Blocks low-reputation IPs (score < 20)
 * - Stricter limits for suspicious IPs (score < 50)
 * - Rate limit violation tracking
 * - Standard rate limit headers (X-RateLimit-*)
 * - Retry-After header on 429 responses
 */

interface EnhancedRateLimiterOptions {
  windowMs: number;
  max: number;
  suspiciousMax?: number; // Stricter limit for suspicious IPs (default: max / 2)
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

// In-memory store for tracking rate limits per IP
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Create an enhanced rate limiter with IP reputation checking
 *
 * @param options - Rate limiter options
 * @returns Express middleware
 */
export function createEnhancedRateLimiter(options: EnhancedRateLimiterOptions) {
  const suspiciousMax = options.suspiciousMax || Math.floor(options.max / 2);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = ipReputationService.getClientIp(req);

      // Check if IP is blocked
      const isBlocked = await ipReputationService.isBlocked(ip);
      if (isBlocked) {
        logger.warn('Request from blocked IP', {
          ip,
          path: req.path,
          method: req.method,
        });

        return sendError(
          res,
          403,
          'IP_BLOCKED',
          'Your IP address has been blocked due to suspicious activity. Please contact support if you believe this is an error.'
        );
      }

      // Get IP reputation
      const reputation = await ipReputationService.getReputation(ip);
      const score = reputation?.reputationScore || 100;

      // Determine rate limit based on reputation
      let maxRequests = options.max;
      if (score < 50) {
        maxRequests = suspiciousMax;
        logger.info('Applying stricter rate limit for suspicious IP', {
          ip,
          score,
          normalMax: options.max,
          suspiciousMax,
        });
      }

      // Create dynamic rate limiter for this request
      // standardHeaders: true automatically adds:
      // - X-RateLimit-Limit
      // - X-RateLimit-Remaining
      // - X-RateLimit-Reset
      const limiter = rateLimit({
        windowMs: options.windowMs,
        max: maxRequests,
        standardHeaders: true, // Adds X-RateLimit-* headers automatically
        legacyHeaders: false,
        skipSuccessfulRequests: options.skipSuccessfulRequests,
        skipFailedRequests: options.skipFailedRequests,
        keyGenerator: (req) => ipReputationService.getClientIp(req),
        handler: async (req, res) => {
          const ip = ipReputationService.getClientIp(req);

          // Track rate limit violation
          await ipReputationService.trackIP(ip, 'rate_limit', false, {
            userAgent: req.get('user-agent'),
            reason: 'Rate limit exceeded',
          });

          // Calculate retry after time in seconds
          const retryAfter = Math.ceil(options.windowMs / 1000);

          // Add rate limit headers (reinforce standardHeaders)
          // X-RateLimit-Limit: Maximum requests allowed
          res.setHeader('X-RateLimit-Limit', maxRequests.toString());
          // X-RateLimit-Remaining: Requests remaining (0 when exceeded)
          res.setHeader('X-RateLimit-Remaining', '0');
          // X-RateLimit-Reset: ISO timestamp when limit resets
          res.setHeader(
            'X-RateLimit-Reset',
            new Date(Date.now() + options.windowMs).toISOString()
          );
          // Retry-After: Seconds to wait before retrying (RFC 6585)
          res.setHeader('Retry-After', retryAfter.toString());

          logger.warn('Rate limit exceeded', {
            ip,
            path: req.path,
            method: req.method,
            score,
            limit: maxRequests,
            window: `${options.windowMs / 1000}s`,
          });

          sendError(
            res,
            429,
            'TOO_MANY_REQUESTS',
            options.message || 'Too many requests, please try again later'
          );
        },
      });

      // Apply the rate limiter
      limiter(req, res, next);
    } catch (error) {
      // If reputation check fails, apply default rate limit
      logger.error('Error in enhanced rate limiter', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
      });

      // Fallback to standard rate limiting
      const fallbackLimiter = rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => {
          sendError(
            res,
            429,
            'TOO_MANY_REQUESTS',
            options.message || 'Too many requests, please try again later'
          );
        },
      });

      fallbackLimiter(req, res, next);
    }
  };
}

/**
 * Enhanced default rate limiter - 100 requests per minute
 */
export const enhancedDefaultLimiter = createEnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  suspiciousMax: 50,
  message: 'Too many requests, please try again later',
});

/**
 * Enhanced auth rate limiter - Strict limits for authentication endpoints
 * Production: 5 requests per 15 minutes
 * Development: 20 requests per 15 minutes
 */
export const enhancedAuthLimiter = createEnhancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'development' ? 20 : 5,
  suspiciousMax: process.env['NODE_ENV'] === 'development' ? 10 : 3,
  message: 'Too many authentication attempts, please try again later',
});

/**
 * Enhanced API rate limiter - 30 requests per minute
 */
export const enhancedApiLimiter = createEnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  suspiciousMax: 15,
  message: 'Too many API requests, please try again later',
});

/**
 * Enhanced strict rate limiter - 10 requests per minute
 * For sensitive operations like checkout
 */
export const enhancedStrictLimiter = createEnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  suspiciousMax: 5,
  message: 'Too many requests for this operation, please try again later',
});

/**
 * Middleware to add rate limit headers to responses
 *
 * Adds standard rate limit headers:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests in window
 * - X-RateLimit-Reset: Time when the limit resets
 */
export function addRateLimitHeaders(
  windowMs: number,
  max: number
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    // Override send to add headers
    res.send = function (data: any): Response {
      // Add rate limit headers if not already present
      if (!res.getHeader('X-RateLimit-Limit')) {
        res.setHeader('X-RateLimit-Limit', max.toString());
      }
      if (!res.getHeader('X-RateLimit-Reset')) {
        res.setHeader(
          'X-RateLimit-Reset',
          new Date(Date.now() + windowMs).toISOString()
        );
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}
