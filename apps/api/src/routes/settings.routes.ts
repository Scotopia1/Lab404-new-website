import { Router } from 'express';
import { z } from 'zod';
import { getDb, settings, adminActivityLogs, eq, desc, and, gte, inArray, sql } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const settingsRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const updateSettingSchema = z.object({
  value: z.string(),
  description: z.string().max(500).optional(),
});

const bulkUpdateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
});

const activityLogFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Default settings with descriptions
const DEFAULT_SETTINGS: Record<string, { value: string; description: string; category: string }> = {
  // Company Settings
  company_name: { value: 'Lab404 Electronics', description: 'Company name displayed on invoices and emails', category: 'company' },
  company_email: { value: 'info@lab404.com', description: 'Primary contact email', category: 'company' },
  company_phone: { value: '', description: 'Company phone number', category: 'company' },
  company_address: { value: '', description: 'Company address for invoices', category: 'company' },
  company_website: { value: '', description: 'Company website URL', category: 'company' },
  company_logo: { value: '', description: 'URL to company logo', category: 'company' },

  // Tax Settings
  tax_rate: { value: '0.11', description: 'Default tax rate (11% = 0.11)', category: 'tax' },
  tax_name: { value: 'VAT', description: 'Tax name displayed on invoices', category: 'tax' },
  tax_included: { value: 'false', description: 'Whether prices include tax', category: 'tax' },

  // Shipping Settings
  free_shipping_threshold: { value: '100', description: 'Order amount for free shipping (0 to disable)', category: 'shipping' },
  default_shipping_rate: { value: '10', description: 'Default shipping rate in USD', category: 'shipping' },
  shipping_origin_country: { value: 'US', description: 'Shipping origin country code', category: 'shipping' },

  // Order Settings
  order_prefix: { value: 'ORD', description: 'Prefix for order numbers', category: 'orders' },
  quotation_prefix: { value: 'QT', description: 'Prefix for quotation numbers', category: 'orders' },
  quotation_validity_days: { value: '30', description: 'Default quotation validity in days', category: 'orders' },
  low_stock_threshold: { value: '10', description: 'Stock level for low stock alerts', category: 'orders' },

  // Email Settings
  smtp_host: { value: '', description: 'SMTP server host', category: 'email' },
  smtp_port: { value: '587', description: 'SMTP server port', category: 'email' },
  smtp_user: { value: '', description: 'SMTP username', category: 'email' },
  smtp_from_name: { value: 'Lab404 Electronics', description: 'From name for emails', category: 'email' },
  smtp_from_email: { value: 'noreply@lab404.com', description: 'From email address', category: 'email' },
  email_order_confirmation: { value: 'true', description: 'Send order confirmation emails to customers', category: 'email' },
  email_shipping_updates: { value: 'true', description: 'Send shipping status update emails to customers', category: 'email' },

  // Tax Settings Extended
  tax_enabled: { value: 'true', description: 'Enable tax calculation on orders', category: 'tax' },

  // Currency Settings
  default_currency: { value: 'USD', description: 'Default currency code', category: 'currency' },
  currency_symbol: { value: '$', description: 'Currency symbol', category: 'currency' },
  currency_position: { value: 'before', description: 'Currency symbol position (before/after)', category: 'currency' },

  // SEO Settings
  site_title: { value: 'Lab404 Electronics', description: 'Default site title for SEO', category: 'seo' },
  site_description: { value: '', description: 'Default meta description', category: 'seo' },
  google_analytics_id: { value: '', description: 'Google Analytics tracking ID', category: 'seo' },

  // Terms
  quotation_terms: { value: '', description: 'Default terms for quotations', category: 'legal' },
  order_terms: { value: '', description: 'Order terms and conditions', category: 'legal' },
  privacy_policy: { value: '', description: 'Privacy policy content or URL', category: 'legal' },
};

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/settings/public
 * Get public settings (non-sensitive)
 */
settingsRoutes.get('/public', async (_req, res, next) => {
  try {
    const db = getDb();
    const publicKeys = [
      'company_name',
      'company_email',
      'company_phone',
      'company_address',
      'company_website',
      'company_logo',
      'tax_name',
      'tax_included',
      'free_shipping_threshold',
      'default_shipping_rate',
      'default_currency',
      'currency_symbol',
      'currency_position',
      'site_title',
      'site_description',
    ];

    const settingsList = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, publicKeys));

    // Merge with defaults
    const result: Record<string, string> = {};
    for (const key of publicKeys) {
      const setting = settingsList.find(s => s.key === key);
      const defaultSetting = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
      result[key] = (setting?.value as string) || defaultSetting?.value || '';
    }

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/settings
 * Get all settings (Admin only)
 */
settingsRoutes.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const db = getDb();

    const settingsList = await db.select().from(settings);

    // Merge with defaults and organize by category
    const result: Record<string, Record<string, { value: string; description: string }>> = {};

    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (!result[def.category]) {
        result[def.category] = {};
      }

      const setting = settingsList.find(s => s.key === key);
      const categoryKey = def.category;
      const categoryResult = result[categoryKey];
      if (categoryResult) {
        categoryResult[key] = {
          value: (setting?.value as string) || def.value,
          description: (setting?.description as string) || def.description,
        };
      }
    }

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/settings/:key
 * Get single setting (Admin only)
 */
settingsRoutes.get('/:key', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const key = req.params['key'] as string;

    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));

    if (!setting) {
      // Return default if exists
      const defaultSetting = DEFAULT_SETTINGS[key];
      if (defaultSetting) {
        return sendSuccess(res, {
          key,
          value: defaultSetting.value,
          description: defaultSetting.description,
          isDefault: true,
        });
      }
      throw new NotFoundError('Setting not found');
    }

    sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings/:key
 * Update a setting (Admin only)
 */
settingsRoutes.put(
  '/:key',
  requireAuth,
  requireAdmin,
  validateBody(updateSettingSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const key = req.params['key'] as string;
      const { value, description } = req.body;

      // Validate setting key
      const defaultSetting = DEFAULT_SETTINGS[key];
      if (!defaultSetting) {
        throw new BadRequestError('Invalid setting key');
      }

      // Validate specific settings
      if (key === 'tax_rate') {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          throw new BadRequestError('Tax rate must be between 0 and 1');
        }
      }

      // Upsert setting
      const [existing] = await db
        .select({ id: settings.id })
        .from(settings)
        .where(eq(settings.key, key));

      let setting;

      if (existing) {
        [setting] = await db
          .update(settings)
          .set({
            value,
            description: description || defaultSetting.description,
            updatedAt: new Date(),
          })
          .where(eq(settings.key, key))
          .returning();
      } else {
        [setting] = await db
          .insert(settings)
          .values({
            key,
            value,
            description: description || defaultSetting.description,
          })
          .returning();
      }

      // Log activity
      if (setting) {
        await db.insert(adminActivityLogs).values({
          adminUserId: req.user!.id,
          action: 'update',
          entityType: 'setting',
          entityId: setting.id,
          details: { key, oldValue: existing ? 'hidden' : null, newValue: 'hidden' },
        });
      }

      sendSuccess(res, setting);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/settings
 * Bulk update settings (Admin only)
 */
settingsRoutes.put(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(bulkUpdateSettingsSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { settings: updates } = req.body;

      const updated: Array<{ key: string; value: string }> = [];

      for (const { key, value } of updates) {
        if (!DEFAULT_SETTINGS[key]) {
          continue; // Skip invalid keys
        }

        const [existing] = await db
          .select({ id: settings.id })
          .from(settings)
          .where(eq(settings.key, key));

        if (existing) {
          await db
            .update(settings)
            .set({
              value,
              updatedAt: new Date(),
            })
            .where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({
            key,
            value,
            description: DEFAULT_SETTINGS[key].description,
          });
        }

        updated.push({ key, value });
      }

      // Log activity
      await db.insert(adminActivityLogs).values({
        adminUserId: req.user!.id,
        action: 'bulk_update',
        entityType: 'settings',
        details: { updatedKeys: updated.map(u => u.key) },
      });

      sendSuccess(res, { updated: updated.length, settings: updated });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/settings/reset
 * Reset settings to defaults (Admin only)
 */
settingsRoutes.post('/reset', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const { keys } = req.body as { keys?: string[] };

    if (keys && keys.length > 0) {
      // Reset specific keys
      for (const key of keys) {
        if (DEFAULT_SETTINGS[key]) {
          await db.delete(settings).where(eq(settings.key, key));
        }
      }
    } else {
      // Reset all
      await db.delete(settings);
    }

    // Log activity
    await db.insert(adminActivityLogs).values({
      adminUserId: req.user!.id,
      action: 'reset',
      entityType: 'settings',
      details: { resetKeys: keys || 'all' },
    });

    sendSuccess(res, { message: 'Settings reset to defaults' });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Activity Log Routes
// ===========================================

/**
 * GET /api/settings/activity-logs
 * Get admin activity logs (Admin only)
 */
settingsRoutes.get(
  '/activity-logs',
  requireAuth,
  requireAdmin,
  validateQuery(activityLogFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { adminId, action, entityType, startDate, endDate } = req.query;

      const conditions = [];

      if (adminId) {
        conditions.push(eq(adminActivityLogs.adminUserId, adminId as string));
      }

      if (action) {
        conditions.push(eq(adminActivityLogs.action, action as string));
      }

      if (entityType) {
        conditions.push(eq(adminActivityLogs.entityType, entityType as string));
      }

      if (startDate) {
        conditions.push(gte(adminActivityLogs.createdAt, new Date(startDate as string)));
      }

      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        conditions.push(sql`${adminActivityLogs.createdAt} <= ${end}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminActivityLogs)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

      const logs = await db
        .select({
          id: adminActivityLogs.id,
          adminUserId: adminActivityLogs.adminUserId,
          action: adminActivityLogs.action,
          entityType: adminActivityLogs.entityType,
          entityId: adminActivityLogs.entityId,
          details: adminActivityLogs.details,
          ipAddress: adminActivityLogs.ipAddress,
          createdAt: adminActivityLogs.createdAt,
        })
        .from(adminActivityLogs)
        .where(whereClause)
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, logs, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);
