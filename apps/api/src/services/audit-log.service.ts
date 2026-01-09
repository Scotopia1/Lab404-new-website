import { getDb } from '@lab404/database';
import { securityAuditLogs, type SecurityAuditLog, type NewSecurityAuditLog } from '@lab404/database';
import { eq, and, gte, lte, inArray, desc, sql } from 'drizzle-orm';
import { Request } from 'express';
import type {
  SecurityEventType,
  ActorType,
  EventStatus,
  AuditLogEvent,
} from '../types/audit-events';
import { logger } from '../utils/logger';

/**
 * Audit Log Service
 *
 * Handles security audit logging for compliance, forensics, and monitoring.
 *
 * Key Features:
 * - Async, non-blocking logging (fire-and-forget)
 * - Automatic context extraction from Express requests
 * - Immutable append-only logs
 * - 90-day retention
 * - Query and export interfaces
 */
class AuditLogService {
  /**
   * Log a security event
   *
   * @param event - The security event to log
   * @returns Promise<void> - Fire-and-forget, errors are logged but don't throw
   */
  async log(event: AuditLogEvent): Promise<void> {
    try {
      const db = getDb();
      const logEntry: NewSecurityAuditLog = {
        timestamp: new Date(),
        eventType: event.eventType,
        actorType: event.actorType,
        actorId: event.actorId || null,
        actorEmail: event.actorEmail || null,
        targetType: event.targetType || null,
        targetId: event.targetId || null,
        action: event.action,
        status: event.status,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        sessionId: event.sessionId || null,
        requestId: event.requestId || null,
        metadata: event.metadata || null,
        createdAt: new Date(),
      };

      await db.insert(securityAuditLogs).values(logEntry);
    } catch (error) {
      // Log failures don't break requests
      logger.error('Failed to write audit log', {
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Log a security event from an Express request
   *
   * Automatically extracts context (IP, User-Agent, session, etc.)
   *
   * @param req - Express request object
   * @param event - Partial event (context auto-filled)
   */
  async logFromRequest(
    req: Request,
    event: Omit<AuditLogEvent, 'ipAddress' | 'userAgent' | 'sessionId' | 'requestId'>
  ): Promise<void> {
    const fullEvent: AuditLogEvent = {
      ...event,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent') || undefined,
      sessionId: (req as any).user?.sessionId || undefined,
      requestId: (req as any).id || undefined,
    };

    await this.log(fullEvent);
  }

  /**
   * Query audit logs with filters and pagination
   *
   * @param filters - Query filters
   * @returns Array of audit logs
   */
  async query(filters: {
    actorId?: string;
    eventTypes?: SecurityEventType[];
    status?: EventStatus;
    ipAddress?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SecurityAuditLog[]> {
    try {
      const db = getDb();
      const conditions = [];

      if (filters.actorId) {
        conditions.push(eq(securityAuditLogs.actorId, filters.actorId));
      }

      if (filters.eventTypes && filters.eventTypes.length > 0) {
        conditions.push(inArray(securityAuditLogs.eventType, filters.eventTypes));
      }

      if (filters.status) {
        conditions.push(eq(securityAuditLogs.status, filters.status));
      }

      if (filters.ipAddress) {
        conditions.push(eq(securityAuditLogs.ipAddress, filters.ipAddress));
      }

      if (filters.sessionId) {
        conditions.push(eq(securityAuditLogs.sessionId, filters.sessionId));
      }

      if (filters.startDate) {
        conditions.push(gte(securityAuditLogs.timestamp, filters.startDate));
      }

      if (filters.endDate) {
        conditions.push(lte(securityAuditLogs.timestamp, filters.endDate));
      }

      let query = db
        .select()
        .from(securityAuditLogs)
        .orderBy(desc(securityAuditLogs.timestamp))
        .limit(filters.limit || 50)
        .offset(filters.offset || 0);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query;
      return results;
    } catch (error) {
      logger.error('Failed to query audit logs', {
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get a single audit log by ID
   *
   * @param id - Audit log ID
   * @returns Audit log or null
   */
  async getById(id: string): Promise<SecurityAuditLog | null> {
    try {
      const db = getDb();
      const results = await db
        .select()
        .from(securityAuditLogs)
        .where(eq(securityAuditLogs.id, id))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      logger.error('Failed to get audit log by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export audit logs to JSON
   *
   * @param filters - Query filters
   * @returns JSON string of audit logs
   */
  async exportToJSON(filters: Parameters<typeof this.query>[0]): Promise<string> {
    const logs = await this.query({ ...filters, limit: 10000 });
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export audit logs to CSV
   *
   * @param filters - Query filters
   * @returns CSV string of audit logs
   */
  async exportToCSV(filters: Parameters<typeof this.query>[0]): Promise<string> {
    const logs = await this.query({ ...filters, limit: 10000 });

    if (logs.length === 0) {
      return 'No logs found';
    }

    // CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'Event Type',
      'Actor Type',
      'Actor ID',
      'Actor Email',
      'Target Type',
      'Target ID',
      'Action',
      'Status',
      'IP Address',
      'User Agent',
      'Session ID',
      'Request ID',
      'Metadata',
    ].join(',');

    // CSV rows
    const rows = logs.map((log) => {
      return [
        log.id,
        log.timestamp.toISOString(),
        log.eventType,
        log.actorType,
        log.actorId || '',
        log.actorEmail || '',
        log.targetType || '',
        log.targetId || '',
        log.action,
        log.status,
        log.ipAddress || '',
        log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : '',
        log.sessionId || '',
        log.requestId || '',
        log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
      ].join(',');
    });

    return `${headers}\n${rows.join('\n')}`;
  }

  /**
   * Delete audit logs older than retention period (90 days)
   *
   * @returns Number of deleted logs
   */
  async cleanup(): Promise<number> {
    try {
      const db = getDb();
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedLogs = await db
        .delete(securityAuditLogs)
        .where(lte(securityAuditLogs.timestamp, cutoffDate))
        .returning({ id: securityAuditLogs.id });

      logger.info('Audit log cleanup completed', {
        deletedCount: deletedLogs.length,
        cutoffDate: cutoffDate.toISOString(),
      });

      return deletedLogs.length;
    } catch (error) {
      logger.error('Failed to cleanup audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get statistics about audit logs
   *
   * @param filters - Optional filters
   * @returns Statistics object
   */
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    actorId?: string;
  }): Promise<{
    totalLogs: number;
    successCount: number;
    failureCount: number;
    deniedCount: number;
    eventTypeCounts: Record<string, number>;
  }> {
    try {
      const db = getDb();
      const conditions = [];

      if (filters?.startDate) {
        conditions.push(gte(securityAuditLogs.timestamp, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(securityAuditLogs.timestamp, filters.endDate));
      }

      if (filters?.actorId) {
        conditions.push(eq(securityAuditLogs.actorId, filters.actorId));
      }

      let logsQuery = db.select().from(securityAuditLogs);

      if (conditions.length > 0) {
        logsQuery = logsQuery.where(and(...conditions));
      }

      const logs = await logsQuery;

      const stats = {
        totalLogs: logs.length,
        successCount: logs.filter((log) => log.status === 'success').length,
        failureCount: logs.filter((log) => log.status === 'failure').length,
        deniedCount: logs.filter((log) => log.status === 'denied').length,
        eventTypeCounts: logs.reduce(
          (acc, log) => {
            acc[log.eventType] = (acc[log.eventType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get audit log statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get client IP address from request
   *
   * Handles X-Forwarded-For header for proxies
   *
   * @param req - Express request
   * @returns IP address
   */
  private getClientIp(req: Request): string {
    const forwardedFor = req.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}

export const auditLogService = new AuditLogService();
