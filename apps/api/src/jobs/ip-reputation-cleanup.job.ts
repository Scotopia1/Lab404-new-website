import cron from 'node-cron';
import { ipReputationService } from '../services/ip-reputation.service';
import { logger } from '../utils/logger';

/**
 * IP Reputation Cleanup Cron Job
 *
 * Runs daily at 3:00 AM UTC
 *
 * Tasks:
 * 1. Remove expired temporary IP blocks
 * 2. Gradually improve reputation scores (increase by 10 for IPs with score < 100)
 *
 * This helps with:
 * - Automatic unblocking of temporary bans
 * - Reputation recovery for reformed IPs
 * - Keeping the reputation system current
 */
export function startIpReputationCleanupJob() {
  // Run daily at 3:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Starting IP reputation cleanup job');

      const { unblockedCount, improvedCount } = await ipReputationService.cleanupExpiredBlocks();

      logger.info('IP reputation cleanup job completed', {
        unblockedCount,
        improvedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('IP reputation cleanup job failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });

  logger.info('IP reputation cleanup cron job scheduled (daily at 3:00 AM UTC)');
}
