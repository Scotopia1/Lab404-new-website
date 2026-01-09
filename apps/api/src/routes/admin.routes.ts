import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { auditLogService } from '../services/audit-log.service';
import { SecurityEventType, EventStatus } from '../types/audit-events';

export const adminRoutes = Router();

// Apply admin auth to all routes
adminRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const auditLogFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventType: z.nativeEnum(SecurityEventType).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  actorId: z.string().optional(),
  ipAddress: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const exportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventType: z.nativeEnum(SecurityEventType).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  actorId: z.string().optional(),
  ipAddress: z.string().optional(),
  format: z.enum(['csv', 'json']).optional().default('json'),
});

// ===========================================
// Admin Audit Log Routes
// ===========================================

/**
 * GET /api/admin/audit-logs
 * List audit logs with pagination and filters
 */
adminRoutes.get('/audit-logs', validateQuery(auditLogFiltersSchema), async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      eventType,
      status,
      actorId,
      ipAddress,
      limit,
      offset,
    } = req.query;

    // Parse query parameters
    const filters: Parameters<typeof auditLogService.query>[0] = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      eventTypes: eventType ? [eventType as SecurityEventType] : undefined,
      status: status as EventStatus | undefined,
      actorId: actorId as string | undefined,
      ipAddress: ipAddress as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    const logs = await auditLogService.query(filters);

    sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/audit-logs/:id
 * Get a specific audit log by ID
 */
adminRoutes.get('/audit-logs/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const log = await auditLogService.getById(id);

    if (!log) {
      throw new NotFoundError('Audit log not found');
    }

    sendSuccess(res, log);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/audit-logs/export
 * Export audit logs to CSV or JSON
 */
adminRoutes.get('/audit-logs/export', validateQuery(exportFiltersSchema), async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      eventType,
      status,
      actorId,
      ipAddress,
      format,
    } = req.query;

    // Parse query parameters
    const filters: Parameters<typeof auditLogService.query>[0] = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      eventTypes: eventType ? [eventType as SecurityEventType] : undefined,
      status: status as EventStatus | undefined,
      actorId: actorId as string | undefined,
      ipAddress: ipAddress as string | undefined,
    };

    let exportData: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      exportData = await auditLogService.exportToCSV(filters);
      contentType = 'text/csv';
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      exportData = await auditLogService.exportToJSON(filters);
      contentType = 'application/json';
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    next(error);
  }
});
