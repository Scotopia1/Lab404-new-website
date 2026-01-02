import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log error
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed', details);
  }

  // Handle unexpected errors
  const message = config.isDev ? err.message : 'Internal server error';

  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}
