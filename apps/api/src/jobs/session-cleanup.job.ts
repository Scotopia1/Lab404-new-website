import cron from 'node-cron';
import { sessionService } from '../services/session.service';
import { logger } from '../utils/logger';

/**
 * Session cleanup cron job
 * Runs daily at 3:00 AM UTC
 * Cleans up:
 * - Revoked sessions older than 30 days
 * - Inactive sessions older than 7 days
 * - Very old sessions (90+ days)
 */
export function startSessionCleanupJob() {
  // Run daily at 3:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Starting session cleanup job');

      const deletedCount = await sessionService.cleanupSessions();

      logger.info('Session cleanup job completed', {
        deletedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Session cleanup job failed', { error });
    }
  });

  logger.info('Session cleanup cron job scheduled (daily at 3:00 AM UTC)');
}
