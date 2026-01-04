import { Router } from 'express';
import { z } from 'zod';
import { getDb, settings, adminActivityLogs, eq, desc, and, gte, inArray, sql } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const settingsRoutes = Router();

// ===========================================
// Types for grouped settings in database
// ===========================================

interface BusinessSettings {
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  currency: string;
  currency_symbol: string;
}

interface TaxSettings {
  tax_rate: number;
  tax_label: string;
  tax_enabled: boolean;
}

interface DeliverySettings {
  delivery_fee: number;
  delivery_enabled: boolean;
  free_delivery_threshold: number;
  delivery_time_min: number;
  delivery_time_max: number;
}

interface NotificationSettings {
  email_notifications: boolean;
  sound_notifications: boolean;
  low_stock_notifications: boolean;
  new_order_notifications: boolean;
}

interface SystemSettings {
  site_title: string;
  site_description: string;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  max_cart_items: number;
}

// Default values for grouped settings
const DEFAULT_BUSINESS: BusinessSettings = {
  business_name: 'Lab404 Electronics',
  business_email: 'info@lab404.com',
  business_phone: '',
  business_address: '',
  currency: 'USD',
  currency_symbol: '$',
};

const DEFAULT_TAX: TaxSettings = {
  tax_rate: 0,
  tax_label: 'VAT',
  tax_enabled: false,
};

const DEFAULT_DELIVERY: DeliverySettings = {
  delivery_fee: 0,
  delivery_enabled: false,
  free_delivery_threshold: 0,
  delivery_time_min: 7,
  delivery_time_max: 14,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email_notifications: true,
  sound_notifications: true,
  low_stock_notifications: true,
  new_order_notifications: true,
};

const DEFAULT_SYSTEM: SystemSettings = {
  site_title: 'Lab404 Electronics',
  site_description: 'Your trusted electronics store',
  maintenance_mode: false,
  allow_guest_checkout: true,
  max_cart_items: 99,
};

// ===========================================
// Validation Schemas
// ===========================================

const activityLogFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for updating all admin settings at once
const updateAdminSettingsSchema = z.object({
  // Business/Store Info
  business_name: z.string().min(1).optional(),
  business_email: z.string().email().optional(),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  currency: z.string().optional(),
  currency_symbol: z.string().optional(),
  // Tax
  tax_rate: z.number().min(0).max(100).optional(),
  tax_label: z.string().optional(),
  tax_enabled: z.boolean().optional(),
  // Delivery/Shipping
  delivery_fee: z.number().min(0).optional(),
  delivery_enabled: z.boolean().optional(),
  free_delivery_threshold: z.number().min(0).optional(),
  // System
  site_title: z.string().optional(),
  site_description: z.string().optional(),
  low_stock_threshold: z.number().min(0).optional(),
  // Notifications
  email_notifications: z.boolean().optional(),
  low_stock_notifications: z.boolean().optional(),
  new_order_notifications: z.boolean().optional(),
});

// ===========================================
// Helper Functions
// ===========================================

async function getGroupedSetting<T>(db: ReturnType<typeof getDb>, key: string, defaultValue: T): Promise<T> {
  const [result] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));

  if (result && result.value) {
    return { ...defaultValue, ...(result.value as T) };
  }
  return defaultValue;
}

async function updateGroupedSetting<T extends object>(
  db: ReturnType<typeof getDb>,
  key: string,
  updates: Partial<T>,
  description: string
): Promise<T> {
  // Get current value
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key));

  let currentValue: T;
  if (existing && existing.value) {
    currentValue = existing.value as T;
  } else {
    // Get default based on key
    switch (key) {
      case 'business': currentValue = DEFAULT_BUSINESS as T; break;
      case 'tax': currentValue = DEFAULT_TAX as T; break;
      case 'delivery': currentValue = DEFAULT_DELIVERY as T; break;
      case 'notifications': currentValue = DEFAULT_NOTIFICATIONS as T; break;
      case 'system': currentValue = DEFAULT_SYSTEM as T; break;
      default: currentValue = {} as T;
    }
  }

  // Merge updates
  const newValue = { ...currentValue, ...updates };

  if (existing) {
    await db
      .update(settings)
      .set({ value: newValue, updatedAt: new Date() })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      value: newValue,
      description,
    });
  }

  return newValue;
}

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/settings/public
 * Get public settings (non-sensitive) - reads from grouped settings
 */
settingsRoutes.get('/public', async (_req, res, next) => {
  try {
    const db = getDb();

    // Fetch grouped settings
    const [businessRow, taxRow, deliveryRow, systemRow] = await Promise.all([
      db.select().from(settings).where(eq(settings.key, 'business')),
      db.select().from(settings).where(eq(settings.key, 'tax')),
      db.select().from(settings).where(eq(settings.key, 'delivery')),
      db.select().from(settings).where(eq(settings.key, 'system')),
    ]);

    const business = businessRow[0]?.value as BusinessSettings || DEFAULT_BUSINESS;
    const tax = taxRow[0]?.value as TaxSettings || DEFAULT_TAX;
    const delivery = deliveryRow[0]?.value as DeliverySettings || DEFAULT_DELIVERY;
    const system = systemRow[0]?.value as SystemSettings || DEFAULT_SYSTEM;

    // Return flattened public settings
    sendSuccess(res, {
      // Business
      company_name: business.business_name,
      company_email: business.business_email,
      company_phone: business.business_phone,
      company_address: business.business_address,
      currency: business.currency,
      currency_symbol: business.currency_symbol,
      // Tax
      tax_rate: tax.tax_rate,
      tax_label: tax.tax_label,
      tax_enabled: tax.tax_enabled,
      // Delivery
      delivery_fee: delivery.delivery_fee,
      delivery_enabled: delivery.delivery_enabled,
      free_delivery_threshold: delivery.free_delivery_threshold,
      // System
      site_title: system.site_title,
      site_description: system.site_description,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/settings
 * Get all settings for admin panel - returns flat structure for easy form binding
 */
settingsRoutes.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const db = getDb();

    // Fetch all grouped settings
    const [businessRow, taxRow, deliveryRow, notificationsRow, systemRow] = await Promise.all([
      db.select().from(settings).where(eq(settings.key, 'business')),
      db.select().from(settings).where(eq(settings.key, 'tax')),
      db.select().from(settings).where(eq(settings.key, 'delivery')),
      db.select().from(settings).where(eq(settings.key, 'notifications')),
      db.select().from(settings).where(eq(settings.key, 'system')),
    ]);

    const business = { ...DEFAULT_BUSINESS, ...(businessRow[0]?.value as BusinessSettings || {}) };
    const tax = { ...DEFAULT_TAX, ...(taxRow[0]?.value as TaxSettings || {}) };
    const delivery = { ...DEFAULT_DELIVERY, ...(deliveryRow[0]?.value as DeliverySettings || {}) };
    const notifications = { ...DEFAULT_NOTIFICATIONS, ...(notificationsRow[0]?.value as NotificationSettings || {}) };
    const system = { ...DEFAULT_SYSTEM, ...(systemRow[0]?.value as SystemSettings || {}) };

    // Return flat structure for admin form
    sendSuccess(res, {
      // Store/Business Information
      business_name: business.business_name,
      business_email: business.business_email,
      business_phone: business.business_phone,
      business_address: business.business_address,

      // Currency
      currency: business.currency,
      currency_symbol: business.currency_symbol,

      // Tax
      tax_rate: tax.tax_rate,
      tax_label: tax.tax_label,
      tax_enabled: tax.tax_enabled,

      // Delivery/Shipping
      delivery_fee: delivery.delivery_fee,
      delivery_enabled: delivery.delivery_enabled,
      free_delivery_threshold: delivery.free_delivery_threshold,
      delivery_time_min: delivery.delivery_time_min,
      delivery_time_max: delivery.delivery_time_max,

      // Notifications
      email_notifications: notifications.email_notifications,
      sound_notifications: notifications.sound_notifications,
      low_stock_notifications: notifications.low_stock_notifications,
      new_order_notifications: notifications.new_order_notifications,

      // System
      site_title: system.site_title,
      site_description: system.site_description,
      maintenance_mode: system.maintenance_mode,
      allow_guest_checkout: system.allow_guest_checkout,
      max_cart_items: system.max_cart_items,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/settings
 * Update settings - accepts flat structure and updates grouped settings
 */
settingsRoutes.put(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(updateAdminSettingsSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const updates = req.body;
      const updatedGroups: string[] = [];

      // Group updates by category
      const businessUpdates: Partial<BusinessSettings> = {};
      const taxUpdates: Partial<TaxSettings> = {};
      const deliveryUpdates: Partial<DeliverySettings> = {};
      const notificationUpdates: Partial<NotificationSettings> = {};
      const systemUpdates: Partial<SystemSettings> = {};

      // Map flat fields to groups
      if (updates.business_name !== undefined) businessUpdates.business_name = updates.business_name;
      if (updates.business_email !== undefined) businessUpdates.business_email = updates.business_email;
      if (updates.business_phone !== undefined) businessUpdates.business_phone = updates.business_phone;
      if (updates.business_address !== undefined) businessUpdates.business_address = updates.business_address;
      if (updates.currency !== undefined) businessUpdates.currency = updates.currency;
      if (updates.currency_symbol !== undefined) businessUpdates.currency_symbol = updates.currency_symbol;

      if (updates.tax_rate !== undefined) taxUpdates.tax_rate = updates.tax_rate;
      if (updates.tax_label !== undefined) taxUpdates.tax_label = updates.tax_label;
      if (updates.tax_enabled !== undefined) taxUpdates.tax_enabled = updates.tax_enabled;

      if (updates.delivery_fee !== undefined) deliveryUpdates.delivery_fee = updates.delivery_fee;
      if (updates.delivery_enabled !== undefined) deliveryUpdates.delivery_enabled = updates.delivery_enabled;
      if (updates.free_delivery_threshold !== undefined) deliveryUpdates.free_delivery_threshold = updates.free_delivery_threshold;

      if (updates.email_notifications !== undefined) notificationUpdates.email_notifications = updates.email_notifications;
      if (updates.low_stock_notifications !== undefined) notificationUpdates.low_stock_notifications = updates.low_stock_notifications;
      if (updates.new_order_notifications !== undefined) notificationUpdates.new_order_notifications = updates.new_order_notifications;

      if (updates.site_title !== undefined) systemUpdates.site_title = updates.site_title;
      if (updates.site_description !== undefined) systemUpdates.site_description = updates.site_description;

      // Update each group if there are changes
      if (Object.keys(businessUpdates).length > 0) {
        await updateGroupedSetting(db, 'business', businessUpdates, 'Business settings');
        updatedGroups.push('business');
      }

      if (Object.keys(taxUpdates).length > 0) {
        await updateGroupedSetting(db, 'tax', taxUpdates, 'Tax settings');
        updatedGroups.push('tax');
      }

      if (Object.keys(deliveryUpdates).length > 0) {
        await updateGroupedSetting(db, 'delivery', deliveryUpdates, 'Delivery settings');
        updatedGroups.push('delivery');
      }

      if (Object.keys(notificationUpdates).length > 0) {
        await updateGroupedSetting(db, 'notifications', notificationUpdates, 'Notification settings');
        updatedGroups.push('notifications');
      }

      if (Object.keys(systemUpdates).length > 0) {
        await updateGroupedSetting(db, 'system', systemUpdates, 'System settings');
        updatedGroups.push('system');
      }

      // Log activity
      if (updatedGroups.length > 0) {
        await db.insert(adminActivityLogs).values({
          adminUserId: req.user!.id,
          action: 'update',
          entityType: 'settings',
          details: { updatedGroups, updatedFields: Object.keys(updates) },
        });
      }

      sendSuccess(res, {
        message: 'Settings updated successfully',
        updatedGroups,
        updatedFields: Object.keys(updates),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/settings/:key
 * Get a specific grouped setting (Admin only)
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
      // Return default if it's a known group
      const defaults: Record<string, unknown> = {
        business: DEFAULT_BUSINESS,
        tax: DEFAULT_TAX,
        delivery: DEFAULT_DELIVERY,
        notifications: DEFAULT_NOTIFICATIONS,
        system: DEFAULT_SYSTEM,
      };

      if (defaults[key]) {
        return sendSuccess(res, {
          key,
          value: defaults[key],
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
 * POST /api/settings/reset
 * Reset settings to defaults (Admin only)
 */
settingsRoutes.post('/reset', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const { groups } = req.body as { groups?: string[] };

    const validGroups = ['business', 'tax', 'delivery', 'notifications', 'system'];

    if (groups && groups.length > 0) {
      // Reset specific groups
      for (const group of groups) {
        if (validGroups.includes(group)) {
          await db.delete(settings).where(eq(settings.key, group));
        }
      }
    } else {
      // Reset all grouped settings
      for (const group of validGroups) {
        await db.delete(settings).where(eq(settings.key, group));
      }
    }

    // Log activity
    await db.insert(adminActivityLogs).values({
      adminUserId: req.user!.id,
      action: 'reset',
      entityType: 'settings',
      details: { resetGroups: groups || 'all' },
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
