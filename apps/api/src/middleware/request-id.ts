import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 *
 * Generates a unique UUID for each request and attaches it to req.id
 * This enables correlation of logs, audit events, and errors across the system
 *
 * Usage:
 * ```ts
 * app.use(requestIdMiddleware);
 * ```
 *
 * The request ID can then be accessed in handlers:
 * ```ts
 * const requestId = req.id;
 * ```
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if request already has an ID (from load balancer/proxy)
  const existingId = req.get('X-Request-ID');

  // Use existing ID or generate new one
  const requestId = existingId || uuidv4();

  // Attach to request object
  (req as any).id = requestId;

  // Also send in response headers for client correlation
  res.setHeader('X-Request-ID', requestId);

  next();
}
