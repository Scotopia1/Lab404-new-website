import cron from 'node-cron';
import { auditLogService } from '../services/audit-log.service';
import { logger } from '../utils/logger';

/**
 * Audit log cleanup cron job
 * Runs daily at 4:00 AM UTC
 * Cleans up audit logs older than 90 days (retention policy)
 */
export function startAuditLogCleanupJob() {
  // Run daily at 4:00 AM UTC
  cron.schedule('0 4 * * *', async () => {
    try {
      logger.info('Starting audit log cleanup job');

      const deletedCount = await auditLogService.cleanup();

      logger.info('Audit log cleanup job completed', {
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Audit log cleanup job failed', { error });
    }
  });

  logger.info('Audit log cleanup cron job scheduled (daily at 4:00 AM UTC)');
}
