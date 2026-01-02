import { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '@lab404/shared-types';

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
): Response {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Create pagination meta from query params
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse pagination params from query
 * Handles integer overflow by capping values to safe maximums
 */
export function parsePaginationParams(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; offset: number } {
  // Parse with safe integer handling
  let parsedPage = parseInt(query.page || '1', 10);
  let parsedLimit = parseInt(query.limit || '20', 10);

  // Handle NaN, Infinity, and negative numbers
  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    parsedPage = 1;
  }
  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    parsedLimit = 20;
  }

  // Cap to reasonable maximums to prevent integer overflow
  const MAX_PAGE = 1000000; // 1 million pages max
  const MAX_LIMIT = 100;

  const page = Math.min(MAX_PAGE, Math.max(1, parsedPage));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parsedLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
