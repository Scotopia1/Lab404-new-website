import { Router } from 'express';
import { z } from 'zod';
import { validateQuery, validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { auditLogService } from '../services/audit-log.service';
import { ipReputationService } from '../services/ip-reputation.service';
import { SecurityEventType, EventStatus, ActorType } from '../types/audit-events';

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

const ipListFiltersSchema = z.object({
  isBlocked: z.string().optional(),
  minScore: z.string().optional(),
  maxScore: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const blockIPSchema = z.object({
  reason: z.string().min(1, 'Block reason is required'),
  duration: z.number().positive().optional(),
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

// ===========================================
// Admin Abuse Management Routes
// ===========================================

/**
 * GET /api/admin/abuse/ips
 * List IP reputations with pagination and filters
 */
adminRoutes.get('/abuse/ips', validateQuery(ipListFiltersSchema), async (req, res, next) => {
  try {
    const { isBlocked, minScore, maxScore, limit, offset } = req.query;

    // Parse query parameters
    const filters: Parameters<typeof ipReputationService.query>[0] = {
      isBlocked: isBlocked ? isBlocked === 'true' : undefined,
      minScore: minScore ? parseInt(minScore as string, 10) : undefined,
      maxScore: maxScore ? parseInt(maxScore as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    const ips = await ipReputationService.query(filters);

    sendSuccess(res, ips);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/abuse/ips/:ip
 * Get specific IP reputation details
 */
adminRoutes.get('/abuse/ips/:ip', async (req, res, next) => {
  try {
    const ip = req.params.ip as string;

    const reputation = await ipReputationService.getReputation(ip);

    if (!reputation) {
      throw new NotFoundError('IP reputation not found');
    }

    sendSuccess(res, reputation);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/abuse/ips/:ip/block
 * Manually block an IP address
 */
adminRoutes.post('/abuse/ips/:ip/block', validateBody(blockIPSchema), async (req, res, next) => {
  try {
    const ip = req.params['ip'] as string;
    const { reason, duration } = req.body;

    // Block the IP
    await ipReputationService.blockIP(ip, reason, duration);

    // Log the admin action
    await auditLogService.logFromRequest(req, {
      eventType: SecurityEventType.ADMIN_ACTION,
      actorType: ActorType.ADMIN,
      actorId: (req as any).user?.id,
      actorEmail: (req as any).user?.email,
      action: 'block_ip',
      status: EventStatus.SUCCESS,
      metadata: {
        targetIp: ip,
        reason,
        duration: duration || 'permanent',
      },
    });

    sendSuccess(res, { message: 'IP blocked successfully', ip, reason, duration });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/abuse/ips/:ip/unblock
 * Unblock an IP address
 */
adminRoutes.delete('/abuse/ips/:ip/unblock', async (req, res, next) => {
  try {
    const ip = req.params['ip'] as string;

    // Unblock the IP
    await ipReputationService.unblockIP(ip);

    // Log the admin action
    await auditLogService.logFromRequest(req, {
      eventType: SecurityEventType.ADMIN_ACTION,
      actorType: ActorType.ADMIN,
      actorId: (req as any).user?.id,
      actorEmail: (req as any).user?.email,
      action: 'unblock_ip',
      status: EventStatus.SUCCESS,
      metadata: {
        targetIp: ip,
      },
    });

    sendSuccess(res, { message: 'IP unblocked successfully', ip });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/abuse/stats
 * Get abuse prevention statistics
 */
adminRoutes.get('/abuse/stats', async (req, res, next) => {
  try {
    const stats = await ipReputationService.getStatistics();

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});
