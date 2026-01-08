import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

/**
 * Default rate limiter - 100 requests per minute
 */
export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later');
  },
});

/**
 * Auth rate limiter - Strict limits for authentication endpoints
 * Production: 5 requests per 15 minutes (protects against brute force)
 * Development: 20 requests per 15 minutes (allows testing without being too permissive)
 * For login, register, password reset endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'development' ? 20 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many authentication attempts, please try again later');
  },
});

/**
 * API rate limiter - 30 requests per minute
 * For general API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later');
  },
});

/**
 * Strict rate limiter - 10 requests per minute
 * For sensitive operations like checkout
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later');
  },
});

/**
 * Cron rate limiter - 10 requests per 15 minutes
 * For cron job endpoints to prevent abuse
 */
export const cronLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many cron requests, please try again later');
  },
});
