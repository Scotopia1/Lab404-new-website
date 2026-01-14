import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import juice from 'juice';
import {
  getDb,
  newsletterSubscribers,
  newsletterCampaigns,
  newsletterSends,
  eq,
  desc,
  asc,
  and,
  sql,
  inArray,
} from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { mailerService } from '../services/mailer.service';

export const newsletterRoutes = Router();

// Apply admin auth to all routes
newsletterRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const subscriberFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'bounced']).optional(),
  source: z.enum(['footer', 'checkout', 'popup', 'import', 'admin']).optional(),
  search: z.string().optional(),
});

const addSubscriberSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  source: z.enum(['footer', 'checkout', 'popup', 'import', 'admin']).optional().default('admin'),
});

const importSubscribersSchema = z.object({
  subscribers: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().max(100).optional(),
    })
  ).min(1).max(10000),
});

const campaignFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled']).optional(),
});

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  previewText: z.string().max(255).optional().or(z.literal('')),
  content: z.string().min(1),
  dailyLimit: z.coerce.number().int().min(1).max(10000).optional().default(100),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(z.literal('')), // HH:MM format or empty
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  previewText: z.string().max(255).optional().or(z.literal('')),
  content: z.string().min(1).optional(),
  dailyLimit: z.coerce.number().int().min(1).max(10000).optional(),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().or(z.literal('')),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
});

// ===========================================
// Subscriber Routes
// ===========================================

/**
 * GET /api/newsletter/subscribers
 * List all subscribers with pagination and filters
 */
newsletterRoutes.get(
  '/subscribers',
  validateQuery(subscriberFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { status, source, search } = req.query;

      const conditions = [];

      if (status) {
        conditions.push(eq(newsletterSubscribers.status, status as string));
      }

      if (source) {
        conditions.push(eq(newsletterSubscribers.source, source as string));
      }

      if (search) {
        conditions.push(
          sql`(${newsletterSubscribers.email} ILIKE ${`%${search}%`} OR ${newsletterSubscribers.name} ILIKE ${`%${search}%`})`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers)
        .where(whereClause);
      const total = Number(countResult[0]?.count ?? 0);

      // Get subscribers
      const subscribers = await db
        .select()
        .from(newsletterSubscribers)
        .where(whereClause)
        .orderBy(desc(newsletterSubscribers.subscribedAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, subscribers, 200, createPaginationMeta(page, limit, total));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/newsletter/subscribers/stats
 * Get subscriber statistics
 */
newsletterRoutes.get('/subscribers/stats', async (_req, res, next) => {
  try {
    const db = getDb();

    const statsResult = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'active')`,
        unsubscribed: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'unsubscribed')`,
        bounced: sql<number>`count(*) filter (where ${newsletterSubscribers.status} = 'bounced')`,
        thisMonth: sql<number>`count(*) filter (where ${newsletterSubscribers.subscribedAt} >= date_trunc('month', current_date))`,
        thisWeek: sql<number>`count(*) filter (where ${newsletterSubscribers.subscribedAt} >= date_trunc('week', current_date))`,
      })
      .from(newsletterSubscribers);

    const stats = statsResult[0];

    // Get by source
    const bySource = await db
      .select({
        source: newsletterSubscribers.source,
        count: sql<number>`count(*)`,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'))
      .groupBy(newsletterSubscribers.source);

    sendSuccess(res, {
      total: Number(stats?.total ?? 0),
      active: Number(stats?.active ?? 0),
      unsubscribed: Number(stats?.unsubscribed ?? 0),
      bounced: Number(stats?.bounced ?? 0),
      thisMonth: Number(stats?.thisMonth ?? 0),
      thisWeek: Number(stats?.thisWeek ?? 0),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/newsletter/subscribers/export
 * Export subscribers as CSV
 */
newsletterRoutes.get('/subscribers/export', async (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.query;

    const conditions = [];
    if (status) {
      conditions.push(eq(newsletterSubscribers.status, status as string));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subscribers = await db
      .select({
        email: newsletterSubscribers.email,
        name: newsletterSubscribers.name,
        status: newsletterSubscribers.status,
        source: newsletterSubscribers.source,
        subscribedAt: newsletterSubscribers.subscribedAt,
        unsubscribedAt: newsletterSubscribers.unsubscribedAt,
      })
      .from(newsletterSubscribers)
      .where(whereClause)
      .orderBy(desc(newsletterSubscribers.subscribedAt));

    // Generate CSV
    const headers = ['Email', 'Name', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const rows = subscribers.map((s) => [
      s.email,
      s.name || '',
      s.status,
      s.source,
      s.subscribedAt.toISOString(),
      s.unsubscribedAt?.toISOString() || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/subscribers
 * Add a new subscriber (admin)
 */
newsletterRoutes.post(
  '/subscribers',
  validateBody(addSubscriberSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { email, name, source } = req.body;

      // Check if already exists
      const [existing] = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email.toLowerCase()));

      if (existing) {
        throw new BadRequestError('Email already subscribed');
      }

      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      const [subscriber] = await db
        .insert(newsletterSubscribers)
        .values({
          email: email.toLowerCase(),
          name,
          source,
          unsubscribeToken,
          status: 'active',
        })
        .returning();

      sendSuccess(res, subscriber, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/newsletter/subscribers/import
 * Bulk import subscribers
 */
newsletterRoutes.post(
  '/subscribers/import',
  validateBody(importSubscribersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { subscribers: inputSubscribers } = req.body;

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      // Get existing emails
      const existingEmails = new Set(
        (await db.select({ email: newsletterSubscribers.email }).from(newsletterSubscribers))
          .map((s) => s.email.toLowerCase())
      );

      // Filter out existing
      const newSubscribers = inputSubscribers.filter((s: { email: string }) => {
        if (existingEmails.has(s.email.toLowerCase())) {
          results.skipped++;
          return false;
        }
        return true;
      });

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < newSubscribers.length; i += batchSize) {
        const batch = newSubscribers.slice(i, i + batchSize);
        const values = batch.map((s: { email: string; name?: string }) => ({
          email: s.email.toLowerCase(),
          name: s.name || null,
          source: 'import' as const,
          unsubscribeToken: crypto.randomBytes(32).toString('hex'),
          status: 'active' as const,
        }));

        await db.insert(newsletterSubscribers).values(values);
        results.imported += batch.length;
      }

      sendSuccess(res, {
        message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
        ...results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/newsletter/subscribers/:id
 * Remove a subscriber
 */
newsletterRoutes.delete('/subscribers/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [deleted] = await db
      .delete(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundError('Subscriber not found');
    }

    sendSuccess(res, { message: 'Subscriber removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/newsletter/subscribers/bulk
 * Bulk delete subscribers
 */
newsletterRoutes.post(
  '/subscribers/bulk-delete',
  validateBody(z.object({ ids: z.array(z.string().uuid()).min(1) })),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { ids } = req.body;

      const deleted = await db
        .delete(newsletterSubscribers)
        .where(inArray(newsletterSubscribers.id, ids))
        .returning();

      sendSuccess(res, { message: `${deleted.length} subscribers removed` });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Campaign Routes
// ===========================================

/**
 * GET /api/newsletter/campaigns
 * List all campaigns
 */
newsletterRoutes.get(
  '/campaigns',
  validateQuery(campaignFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { status } = req.query;

      const conditions = [];
      if (status) {
        conditions.push(eq(newsletterCampaigns.status, status as string));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterCampaigns)
        .where(whereClause);
      const total = Number(countResult[0]?.count ?? 0);

      // Get campaigns
      const campaigns = await db
        .select()
        .from(newsletterCampaigns)
        .where(whereClause)
        .orderBy(desc(newsletterCampaigns.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, campaigns, 200, createPaginationMeta(page, limit, total));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/newsletter/campaigns/:id
 * Get a specific campaign
 */
newsletterRoutes.get('/campaigns/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    sendSuccess(res, campaign);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/campaigns
 * Create a new campaign
 */
newsletterRoutes.post(
  '/campaigns',
  validateBody(createCampaignSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { name, subject, previewText, content, dailyLimit, sendTime, scheduledAt } = req.body;

      // Get total active subscribers
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, 'active'));
      const subscriberCount = Number(countResult[0]?.count ?? 0);

      // Only set createdBy if user ID is a valid UUID
      const userId = (req as any).user?.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const createdBy = userId && uuidRegex.test(userId) ? userId : null;

      const [campaign] = await db
        .insert(newsletterCampaigns)
        .values({
          name,
          subject,
          previewText: previewText || null,
          content, // Raw HTML preserved - admin-only content
          dailyLimit,
          sendTime: sendTime || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          totalRecipients: subscriberCount,
          status: scheduledAt ? 'scheduled' : 'draft',
          createdBy,
        })
        .returning();

      sendSuccess(res, campaign, 201);
    } catch (error) {
      console.error('Campaign creation error:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/newsletter/campaigns/:id
 * Update a campaign (only draft/paused campaigns)
 */
newsletterRoutes.put(
  '/campaigns/:id',
  validateBody(updateCampaignSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const updates = req.body as Record<string, unknown>;

      const [existing] = await db
        .select()
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, id));

      if (!existing) {
        throw new NotFoundError('Campaign not found');
      }

      if (!['draft', 'paused', 'scheduled'].includes(existing.status)) {
        throw new BadRequestError('Can only edit draft, scheduled, or paused campaigns');
      }

      // If updating scheduledAt, also update status
      const additionalUpdates: Record<string, unknown> = {};
      if (updates['scheduledAt']) {
        additionalUpdates['scheduledAt'] = new Date(updates['scheduledAt'] as string);
        if (existing.status === 'draft') {
          additionalUpdates['status'] = 'scheduled';
        }
      }

      // If content changed, recalculate recipient count
      if (updates['content']) {
        // Raw HTML preserved - admin-only content
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.status, 'active'));
        additionalUpdates['totalRecipients'] = Number(countResult[0]?.count ?? 0);
      }

      const [campaign] = await db
        .update(newsletterCampaigns)
        .set({
          ...updates,
          ...additionalUpdates,
          updatedAt: new Date(),
        })
        .where(eq(newsletterCampaigns.id, id))
        .returning();

      sendSuccess(res, campaign);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/newsletter/campaigns/:id
 * Delete a campaign (only draft campaigns)
 */
newsletterRoutes.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));

    if (!existing) {
      throw new NotFoundError('Campaign not found');
    }

    if (existing.status !== 'draft') {
      throw new BadRequestError('Can only delete draft campaigns');
    }

    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));

    sendSuccess(res, { message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/campaigns/:id/start
 * Start sending a campaign
 */
newsletterRoutes.post('/campaigns/:id/start', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (!['draft', 'scheduled', 'paused'].includes(campaign.status)) {
      throw new BadRequestError('Campaign cannot be started in its current state');
    }

    // Get active subscribers count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'));

    const totalRecipients = Number(countResult[0]?.count ?? 0);

    if (totalRecipients === 0) {
      throw new BadRequestError('No active subscribers to send to');
    }

    // Create send records for all active subscribers who haven't received this campaign
    const activeSubscribers = await db
      .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'));

    // Check for existing sends
    const existingSends = await db
      .select({ subscriberId: newsletterSends.subscriberId })
      .from(newsletterSends)
      .where(eq(newsletterSends.campaignId, id));

    const existingSubscriberIds = new Set(existingSends.map((s) => s.subscriberId));

    // Filter out subscribers who already have sends
    const newSubscribers = activeSubscribers.filter((s) => !existingSubscriberIds.has(s.id));

    if (newSubscribers.length > 0) {
      // Insert in batches
      const batchSize = 500;
      for (let i = 0; i < newSubscribers.length; i += batchSize) {
        const batch = newSubscribers.slice(i, i + batchSize);
        await db.insert(newsletterSends).values(
          batch.map((s) => ({
            campaignId: id,
            subscriberId: s.id,
            email: s.email,
            status: 'pending' as const,
          }))
        );
      }
    }

    // Update campaign status
    const [updated] = await db
      .update(newsletterCampaigns)
      .set({
        status: 'sending',
        totalRecipients,
        startedAt: campaign.startedAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, id))
      .returning();

    sendSuccess(res, {
      message: 'Campaign started',
      campaign: updated,
      pendingSends: newSubscribers.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/campaigns/:id/pause
 * Pause a sending campaign
 */
newsletterRoutes.post('/campaigns/:id/pause', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (campaign.status !== 'sending') {
      throw new BadRequestError('Can only pause campaigns that are sending');
    }

    const [updated] = await db
      .update(newsletterCampaigns)
      .set({
        status: 'paused',
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, id))
      .returning();

    sendSuccess(res, { message: 'Campaign paused', campaign: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/campaigns/:id/cancel
 * Cancel a campaign
 */
newsletterRoutes.post('/campaigns/:id/cancel', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (['completed', 'cancelled'].includes(campaign.status)) {
      throw new BadRequestError('Campaign cannot be cancelled in its current state');
    }

    // Delete pending sends
    await db
      .delete(newsletterSends)
      .where(
        and(
          eq(newsletterSends.campaignId, id),
          eq(newsletterSends.status, 'pending')
        )
      );

    const [updated] = await db
      .update(newsletterCampaigns)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, id))
      .returning();

    sendSuccess(res, { message: 'Campaign cancelled', campaign: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/newsletter/campaigns/:id/sends
 * Get send details for a campaign
 */
newsletterRoutes.get('/campaigns/:id/sends', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
    const { status } = req.query;

    const conditions = [eq(newsletterSends.campaignId, id)];
    if (status) {
      conditions.push(eq(newsletterSends.status, status as string));
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSends)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    // Get sends
    const sends = await db
      .select()
      .from(newsletterSends)
      .where(whereClause)
      .orderBy(asc(newsletterSends.createdAt))
      .limit(limit)
      .offset(offset);

    sendSuccess(res, sends, 200, createPaginationMeta(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/newsletter/campaigns/:id/test
 * Send a test email for a campaign
 */
newsletterRoutes.post(
  '/campaigns/:id/test',
  validateBody(z.object({ email: z.string().email() })),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const { email } = req.body;

      const [campaign] = await db
        .select()
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, id));

      if (!campaign) {
        throw new NotFoundError('Campaign not found');
      }

      // Build test email with unsubscribe footer
      const websiteUrl = process.env['WEBSITE_URL'] || 'https://lab404.com';
      const unsubscribeUrl = `${websiteUrl}/newsletter/unsubscribe?token=test-preview`;
      const unsubscribeFooter = `
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is a test email preview.<br>
          <a href="${unsubscribeUrl}">Unsubscribe</a>
        </p>
      `;
      const contentWithFooter = campaign.content + unsubscribeFooter;

      // Inline CSS for email client compatibility
      // This converts <style> tags to inline styles
      const inlinedHtml = juice(contentWithFooter, {
        removeStyleTags: true,
        preserveMediaQueries: true,
        preserveFontFaces: true,
      });

      // Send actual test email
      const success = await mailerService.sendEmail({
        to: email,
        subject: `[TEST] ${campaign.subject}`,
        html: inlinedHtml,
      });

      if (!success) {
        throw new BadRequestError('Failed to send test email. Check SMTP configuration.');
      }

      sendSuccess(res, {
        message: `Test email sent to ${email}`,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
