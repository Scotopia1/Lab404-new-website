import { Router } from 'express';
import { checkDbHealth, verifySchema, testConnection } from '../utils/db-health';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

export const healthRoutes = Router();

/**
 * GET /api/health
 * Basic health check (public)
 */
healthRoutes.get('/', async (_req, res) => {
  const dbConnected = await testConnection();

  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check (admin only)
 */
healthRoutes.get('/detailed', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const dbHealth = await checkDbHealth();
    const schemaStatus = await verifySchema();

    sendSuccess(res, {
      status: dbHealth.connected && schemaStatus.valid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      database: {
        connected: dbHealth.connected,
        latency: dbHealth.latency,
        version: dbHealth.version,
        error: dbHealth.error,
      },
      schema: {
        valid: schemaStatus.valid,
        tablesCount: dbHealth.tables.length,
        missingTables: schemaStatus.missingTables,
      },
      environment: process.env['NODE_ENV'] || 'development',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Docker
 */
healthRoutes.get('/ready', async (_req, res) => {
  const dbConnected = await testConnection();

  if (dbConnected) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Database not connected' });
  }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes/Docker
 */
healthRoutes.get('/live', (_req, res) => {
  res.status(200).json({ alive: true });
});
