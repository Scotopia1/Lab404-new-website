import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Request validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);

      // Replace the source data with validated data
      (req as unknown as Record<string, unknown>)[source] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate(schema, 'body');
}

/**
 * Validate request query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate(schema, 'query');
}

/**
 * Validate request URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate(schema, 'params');
}
