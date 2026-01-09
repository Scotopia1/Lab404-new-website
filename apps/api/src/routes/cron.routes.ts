import { Router, Request, Response, NextFunction } from 'express';
import { getDb, quotations, settings, eq, and, lte, gte, sql } from '@lab404/database';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notification.service';
import { quotationActivityService } from '../services/quotation-activity.service';
import { verificationCodeService } from '../services';
import { logger } from '../utils/logger';
import { cronLimiter } from '../middleware/rateLimiter';

export const cronRoutes = Router();

// Apply rate limiting to all cron routes
cronRoutes.use(cronLimiter);

// Middleware to verify cron secret (for security)
const verifyCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET;

  // CRON_SECRET is required in all environments (no dev bypass for security)
  if (!expectedSecret) {
    logger.error('CRON_SECRET not configured');
    return sendError(res, 'Cron jobs not configured', 503);
  }

  if (cronSecret !== expectedSecret) {
    logger.warn('Invalid cron secret attempt', { ip: req.ip });
    return sendError(res, 'Forbidden', 403);
  }

  next();
};

interface ExpiryNotificationResult {
  quotationId: string;
  quotationNumber: string;
  customerEmail: string;
  daysUntilExpiry: number;
  status: 'sent' | 'failed';
  error?: string;
}

/**
 * POST /api/cron/quotation-expiry-check
 * Check for quotations expiring soon and send notifications
 *
 * Should be called daily by a cron job (e.g., Vercel cron, GitHub Actions, or external service)
 */
cronRoutes.post('/quotation-expiry-check', verifyCronSecret, async (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();
    const results: ExpiryNotificationResult[] = [];

    // Define expiry windows (days from now)
    const expiryWindows = [1, 3, 7];

    for (const days of expiryWindows) {
      // Calculate the target date range
      const targetDateStart = new Date(now);
      targetDateStart.setDate(targetDateStart.getDate() + days);
      targetDateStart.setHours(0, 0, 0, 0);

      const targetDateEnd = new Date(targetDateStart);
      targetDateEnd.setHours(23, 59, 59, 999);

      // Find quotations expiring on this day
      // Only check 'sent' status quotations (not draft, accepted, etc.)
      const expiringQuotations = await db
        .select()
        .from(quotations)
        .where(
          and(
            eq(quotations.status, 'sent'),
            gte(quotations.validUntil, targetDateStart),
            lte(quotations.validUntil, targetDateEnd)
          )
        );

      logger.info(`Found ${expiringQuotations.length} quotations expiring in ${days} day(s)`);

      for (const quotation of expiringQuotations) {
        try {
          // Send expiry notification email
          await notificationService.sendQuotationExpiryReminder(
            quotation.customerEmail,
            quotation.customerName,
            quotation.quotationNumber,
            days,
            quotation.validUntil!,
            quotation.acceptanceToken || undefined
          );

          // Log activity
          await quotationActivityService.logActivity({
            quotationId: quotation.id,
            activityType: 'note_added',
            description: `Expiry reminder sent (${days} day${days === 1 ? '' : 's'} remaining)`,
            actorType: 'system',
          }).catch(() => {}); // Non-blocking

          results.push({
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber,
            customerEmail: quotation.customerEmail,
            daysUntilExpiry: days,
            status: 'sent',
          });
        } catch (error) {
          logger.error(`Failed to send expiry notification for ${quotation.quotationNumber}:`, error);
          results.push({
            quotationId: quotation.id,
            quotationNumber: quotation.quotationNumber,
            customerEmail: quotation.customerEmail,
            daysUntilExpiry: days,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Auto-expire quotations past their valid date
    const expiredResult = await db
      .update(quotations)
      .set({
        status: 'expired',
        updatedAt: now,
      })
      .where(
        and(
          eq(quotations.status, 'sent'),
          lte(quotations.validUntil, now)
        )
      )
      .returning({ id: quotations.id, quotationNumber: quotations.quotationNumber });

    // Log expiry activities
    for (const expired of expiredResult) {
      await quotationActivityService.logExpired(expired.id).catch(() => {}); // Non-blocking
    }

    const summary = {
      processedAt: now.toISOString(),
      notificationsSent: results.filter(r => r.status === 'sent').length,
      notificationsFailed: results.filter(r => r.status === 'failed').length,
      autoExpired: expiredResult.length,
      details: results,
      expiredQuotations: expiredResult.map(q => q.quotationNumber),
    };

    logger.info('Quotation expiry check completed:', summary);
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cron/cleanup-verification-codes
 * Remove expired and used verification codes older than 24 hours
 *
 * Should be called every 6 hours by a cron job (Vercel cron, GitHub Actions, or external service)
 */
cronRoutes.post('/cleanup-verification-codes', verifyCronSecret, async (req, res, next) => {
  try {
    const startTime = Date.now();

    const deletedCount = await verificationCodeService.cleanupExpiredCodes();

    const duration = Date.now() - startTime;

    logger.info('Verification codes cleanup cron completed', {
      deletedCount,
      durationMs: duration
    });

    sendSuccess(res, {
      message: 'Verification codes cleanup completed',
      deletedCount,
      durationMs: duration,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Verification codes cleanup cron failed', { error });
    next(error);
  }
});

/**
 * GET /api/cron/health
 * Health check for cron jobs
 */
cronRoutes.get('/health', (req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});
