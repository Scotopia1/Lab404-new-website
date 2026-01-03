import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { config } from './config';
import { errorHandler, notFoundHandler, defaultLimiter } from './middleware';
import { logger } from './utils/logger';

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
  // Security Middleware
  // ===========================================

  // Helmet - Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.corsOrigins,
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

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  // Health Check
  // ===========================================

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
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
