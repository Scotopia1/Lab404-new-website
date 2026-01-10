import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './config';
import { errorHandler, notFoundHandler, defaultLimiter } from './middleware';
import { logger } from './utils/logger';
import { generateCsrfToken, doubleCsrfProtection } from './middleware/csrf';
import { xssSanitize } from './middleware/xss';
import { requestIdMiddleware } from './middleware/request-id';

// Import routes
import { router } from './routes';

/**
 * Create Express application
 */
export function createApp() {
  const app = express();

  // Trust proxy for Vercel/cloud deployments
  app.set('trust proxy', 1);

  // ===========================================
  // Request Identification
  // ===========================================

  // Generate unique ID for each request (for audit logging & correlation)
  app.use(requestIdMiddleware);

  // ===========================================
  // Security Middleware
  // ===========================================

  // Helmet - Security headers
  app.use(helmet());

  // CORS - Use function to dynamically return the correct origin
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
          return callback(null, true);
        }

        // Check if the origin is in the allowed list
        if (config.corsOrigins.includes(origin)) {
          callback(null, origin); // Return the specific origin
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-CSRF-Token'],
    })
  );

  // Rate limiting
  app.use(defaultLimiter);

  // ===========================================
  // Request Processing Middleware
  // ===========================================

  // Compression
  app.use(compression());

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // XSS Sanitization - Apply after body parsing, before routes
  app.use(xssSanitize);

  // CSRF Protection - Apply after cookie parser, skip for safe methods and health checks
  app.use((req, res, next) => {
    // Skip CSRF for safe methods, health checks, and public auth endpoints
    const publicAuthPaths = [
      '/api/auth/login',
      '/api/auth/admin/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/verify-reset-code',
      '/api/auth/reset-password',
      '/api/auth/verify-email',
    ];

    if (
      ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
      req.path === '/health' ||
      req.path === '/api/health' ||
      publicAuthPaths.includes(req.path)
    ) {
      return next();
    }
    doubleCsrfProtection(req, res, next);
  });

  // Logging
  if (config.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: { write: (message: string) => logger.http(message.trim()) },
      })
    );
  }

  // ===========================================
  // Health Check & CSRF Token
  // ===========================================

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    const token = generateCsrfToken(req, res);
    res.json({ csrfToken: token });
  });

  // ===========================================
  // API Routes
  // ===========================================

  app.use('/api', router);

  // ===========================================
  // Error Handling
  // ===========================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
