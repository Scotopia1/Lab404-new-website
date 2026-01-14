import { Router, Request, Response, NextFunction } from 'express';
import { getDb, quotations, settings, newsletterCampaigns, newsletterSends, newsletterSubscribers, eq, and, lte, gte, sql, asc } from '@lab404/database';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notification.service';
import { quotationActivityService } from '../services/quotation-activity.service';
import { verificationCodeService } from '../services';
import { mailerService } from '../services/mailer.service';
import { logger } from '../utils/logger';
import { cronLimiter } from '../middleware/rateLimiter';

export const cronRoutes = Router();

// Apply rate limiting to all cron routes
cronRoutes.use(cronLimiter);

// Middleware to verify cron secret (for security)
const verifyCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
  const expectedSecret = process.env['CRON_SECRET'];

  // CRON_SECRET is required in all environments (no dev bypass for security)
  if (!expectedSecret) {
    logger.error('CRON_SECRET not configured');
    return sendError(res, 503, 'CRON_NOT_CONFIGURED', 'Cron jobs not configured');
  }

  if (cronSecret !== expectedSecret) {
    logger.warn('Invalid cron secret attempt', { ip: req.ip });
    return sendError(res, 403, 'FORBIDDEN', 'Forbidden');
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

/**
 * POST /api/cron/newsletter-send
 * Process newsletter sending queue
 *
 * Should be called every hour by a cron job.
 * Sends emails up to the daily limit for each active campaign.
 */
cronRoutes.post('/newsletter-send', verifyCronSecret, async (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const results: {
      campaignId: string;
      campaignName: string;
      emailsSent: number;
      emailsFailed: number;
      completed: boolean;
    }[] = [];

    // Get all active (sending) campaigns
    const activeCampaigns = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, 'sending'));

    logger.info(`Processing ${activeCampaigns.length} active newsletter campaigns`);

    for (const campaign of activeCampaigns) {
      // Count emails sent today for this campaign
      const [todayStats] = await db
        .select({
          sentToday: sql<number>`count(*) filter (where ${newsletterSends.sentAt} >= ${startOfDay})`,
        })
        .from(newsletterSends)
        .where(eq(newsletterSends.campaignId, campaign.id));

      const sentToday = Number(todayStats?.sentToday || 0);
      const remainingToday = Math.max(0, campaign.dailyLimit - sentToday);

      if (remainingToday === 0) {
        logger.info(`Campaign ${campaign.name}: Daily limit reached (${campaign.dailyLimit})`);
        continue;
      }

      // Get pending sends for this campaign (up to remaining daily limit)
      const pendingSends = await db
        .select({
          id: newsletterSends.id,
          email: newsletterSends.email,
          subscriberId: newsletterSends.subscriberId,
        })
        .from(newsletterSends)
        .where(
          and(
            eq(newsletterSends.campaignId, campaign.id),
            eq(newsletterSends.status, 'pending')
          )
        )
        .orderBy(asc(newsletterSends.createdAt))
        .limit(remainingToday);

      if (pendingSends.length === 0) {
        // No more pending - mark campaign as completed
        await db
          .update(newsletterCampaigns)
          .set({
            status: 'completed',
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(newsletterCampaigns.id, campaign.id));

        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          emailsSent: 0,
          emailsFailed: 0,
          completed: true,
        });

        logger.info(`Campaign ${campaign.name}: Completed (all emails sent)`);
        continue;
      }

      let emailsSent = 0;
      let emailsFailed = 0;

      // Process each pending send
      for (const send of pendingSends) {
        try {
          // Get subscriber for unsubscribe token
          const [subscriber] = await db
            .select({ unsubscribeToken: newsletterSubscribers.unsubscribeToken })
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.id, send.subscriberId));

          // Build unsubscribe URL
          const baseUrl = process.env['WEBSITE_URL'] || 'http://localhost:3000';
          const unsubscribeUrl = `${baseUrl}/unsubscribe/${subscriber?.unsubscribeToken || ''}`;

          // Add unsubscribe link to content
          const contentWithUnsubscribe = campaign.content + `
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              You received this email because you subscribed to our newsletter.
              <br>
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
            </p>
          `;

          // Send email
          const success = await mailerService.sendEmail({
            to: send.email,
            subject: campaign.subject,
            html: contentWithUnsubscribe,
          });

          if (success) {
            await db
              .update(newsletterSends)
              .set({
                status: 'sent',
                sentAt: now,
              })
              .where(eq(newsletterSends.id, send.id));

            emailsSent++;
          } else {
            await db
              .update(newsletterSends)
              .set({
                status: 'failed',
                errorMessage: 'Email service returned failure',
                retryCount: sql`${newsletterSends.retryCount} + 1`,
              })
              .where(eq(newsletterSends.id, send.id));

            emailsFailed++;
          }
        } catch (error) {
          logger.error(`Failed to send newsletter to ${send.email}:`, error);

          await db
            .update(newsletterSends)
            .set({
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              retryCount: sql`${newsletterSends.retryCount} + 1`,
            })
            .where(eq(newsletterSends.id, send.id));

          emailsFailed++;
        }
      }

      // Update campaign stats
      await db
        .update(newsletterCampaigns)
        .set({
          sentCount: sql`${newsletterCampaigns.sentCount} + ${emailsSent}`,
          failedCount: sql`${newsletterCampaigns.failedCount} + ${emailsFailed}`,
          lastSentAt: emailsSent > 0 ? now : campaign.lastSentAt,
          updatedAt: now,
        })
        .where(eq(newsletterCampaigns.id, campaign.id));

      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        emailsSent,
        emailsFailed,
        completed: false,
      });

      logger.info(`Campaign ${campaign.name}: Sent ${emailsSent}, Failed ${emailsFailed}`);
    }

    const summary = {
      processedAt: now.toISOString(),
      campaignsProcessed: results.length,
      totalEmailsSent: results.reduce((sum, r) => sum + r.emailsSent, 0),
      totalEmailsFailed: results.reduce((sum, r) => sum + r.emailsFailed, 0),
      campaignsCompleted: results.filter(r => r.completed).length,
      details: results,
    };

    logger.info('Newsletter send cron completed:', summary);
    sendSuccess(res, summary);
  } catch (error) {
    logger.error('Newsletter send cron failed:', error);
    next(error);
  }
});
