import { Router } from 'express';
import { z } from 'zod';
import { getDb, quotations, quotationItems, customers, products, productVariants, settings, pdfTemplates, eq, sql, desc, and, or, like, gte, lte } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { pricingService } from '../services/pricing.service';
import { pdfService } from '../services/pdf.service';
import { notificationService } from '../services/notification.service';
import { quotationActivityService } from '../services/quotation-activity.service';
import { quotationRevisionService } from '../services/quotation-revision.service';
import { generateSecureToken } from '../utils/crypto';
import { logger } from '../utils/logger';

export const quotationsRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

// Schema for quotation items - supports both product-based and custom items
const quotationItemSchema = z.object({
  // For product-based items
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),

  // For custom items (required if no productId)
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  sku: z.string().max(100).optional(),
  unitPrice: z.number().positive().optional(),

  // Common fields
  quantity: z.number().int().min(1),
  customPrice: z.number().positive().optional(), // Override price for product items
}).refine(
  (data) => {
    // Either productId OR (name + unitPrice) must be provided
    if (data.productId) {
      return true; // Product-based item
    }
    return data.name && data.unitPrice; // Custom item needs name and price
  },
  { message: 'Either productId or (name and unitPrice) is required' }
);

const createQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(50).optional(),
  customerCompany: z.string().max(255).optional(),
  items: z.array(quotationItemSchema).min(1),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  validDays: z.number().int().min(1).max(365).optional().default(30),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
});

// Schema for update quotation items - supports both product-based and custom items
const updateQuotationItemSchema = z.object({
  // For product-based items
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),

  // For custom items
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  sku: z.string().max(100).optional(),
  unitPrice: z.number().positive().optional(),

  // Common fields
  quantity: z.number().int().min(1),
  customPrice: z.number().positive().optional(),
}).refine(
  (data) => {
    if (data.productId) {
      return true;
    }
    return data.name && data.unitPrice;
  },
  { message: 'Either productId or (name and unitPrice) is required' }
);

const updateQuotationSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(50).optional().nullable(),
  customerCompany: z.string().max(255).optional().nullable(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  validDays: z.number().int().min(1).max(365).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(1).optional(), // Decimal 0-1
  items: z.array(updateQuotationItemSchema).min(1).optional(),
});

const quotationFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  customerId: z.string().uuid().optional(),
});

// Helper to generate quotation number
function generateQuotationNumber(count: number): string {
  const year = new Date().getFullYear();
  const sequence = String(count).padStart(5, '0');
  return `QT-${year}-${sequence}`;
}

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/quotations
 * List all quotations (Admin only)
 */
quotationsRoutes.get(
  '/',
  requireAuth,
  requireAdmin,
  validateQuery(quotationFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { search, status, customerId } = req.query;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            like(quotations.quotationNumber, `%${search}%`),
            like(quotations.customerName, `%${search}%`),
            like(quotations.customerEmail, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(quotations.status, status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'));
      }

      if (customerId) {
        conditions.push(eq(quotations.customerId, customerId as string));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotations)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

      const quotationList = await db
        .select()
        .from(quotations)
        .where(whereClause)
        .orderBy(desc(quotations.createdAt))
        .limit(limit)
        .offset(offset);

      const formattedList = quotationList.map(q => ({
        ...q,
        subtotal: Number(q.subtotal),
        taxAmount: Number(q.taxAmount || 0),
        discountAmount: Number(q.discountAmount),
        total: Number(q.total),
        isExpired: q.validUntil ? new Date(q.validUntil) < new Date() : false,
      }));

      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/quotations/stats
 * Get quotation statistics (Admin only)
 */
quotationsRoutes.get('/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations);

    // Get counts by status
    const statusCounts = await db
      .select({
        status: quotations.status,
        count: sql<number>`count(*)`,
      })
      .from(quotations)
      .groupBy(quotations.status);

    // Get total value of all quotations
    const [totalValueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(quotations);

    // Get total value of accepted quotations
    const [acceptedValueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(quotations)
      .where(eq(quotations.status, 'accepted'));

    // Get quotations expiring soon (within 7 days, status = sent)
    const [expiringSoonResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(
        and(
          eq(quotations.status, 'sent'),
          gte(quotations.validUntil, now),
          lte(quotations.validUntil, sevenDaysFromNow)
        )
      );

    // Get quotations created this month
    const [thisMonthResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(gte(quotations.createdAt, startOfMonth));

    // Calculate conversion rate (accepted / (accepted + rejected))
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);

    const acceptedCount = statusMap['accepted'] || 0;
    const rejectedCount = statusMap['rejected'] || 0;
    const convertedCount = statusMap['converted'] || 0;
    const totalDecided = acceptedCount + rejectedCount + convertedCount;
    const conversionRate = totalDecided > 0 ? ((acceptedCount + convertedCount) / totalDecided) * 100 : 0;

    sendSuccess(res, {
      total: Number(totalResult.count),
      byStatus: {
        draft: statusMap['draft'] || 0,
        sent: statusMap['sent'] || 0,
        accepted: statusMap['accepted'] || 0,
        rejected: statusMap['rejected'] || 0,
        expired: statusMap['expired'] || 0,
        converted: statusMap['converted'] || 0,
      },
      totalValue: Number(totalValueResult.total),
      acceptedValue: Number(acceptedValueResult.total),
      conversionRate: Math.round(conversionRate * 100) / 100,
      expiringSoon: Number(expiringSoonResult.count),
      thisMonth: Number(thisMonthResult.count),
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Check and Update Expired Quotations
// ===========================================

quotationsRoutes.post('/check-expired', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();

    // Find quotations that should be expired:
    // - Only 'sent' quotations are checked (drafts don't expire automatically)
    // - validUntil date has passed (validUntil is set when quotation is sent)
    const expiredQuotations = await db
      .select({ id: quotations.id, quotationNumber: quotations.quotationNumber })
      .from(quotations)
      .where(
        and(
          eq(quotations.status, 'sent'),
          lte(quotations.validUntil, now)
        )
      );

    if (expiredQuotations.length === 0) {
      sendSuccess(res, {
        updated: 0,
        message: 'No quotations to expire'
      });
      return;
    }

    // Update all expired quotations
    await db
      .update(quotations)
      .set({
        status: 'expired',
        updatedAt: now
      })
      .where(
        and(
          eq(quotations.status, 'sent'),
          lte(quotations.validUntil, now)
        )
      );

    // Log activity for each expired quotation
    for (const q of expiredQuotations) {
      await quotationActivityService.logActivity({
        quotationId: q.id,
        activityType: 'status_changed',
        description: `Quotation automatically expired (past valid date)`,
        actorType: 'system',
        actorName: 'System',
        metadata: {
          previousStatus: 'sent',
          newStatus: 'expired',
          automatic: true
        },
      });
    }

    logger.info('Auto-expired quotations', {
      count: expiredQuotations.length,
      quotationNumbers: expiredQuotations.map(q => q.quotationNumber)
    });

    sendSuccess(res, {
      updated: expiredQuotations.length,
      quotations: expiredQuotations.map(q => q.quotationNumber),
      message: `${expiredQuotations.length} quotation(s) marked as expired`
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Bulk Actions Schema
// ===========================================

const bulkActionsSchema = z.object({
  action: z.enum(['delete', 'send', 'changeStatus']),
  ids: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
}).refine(
  (data) => {
    if (data.action === 'changeStatus' && !data.status) {
      return false;
    }
    return true;
  },
  { message: 'Status is required for changeStatus action' }
);

/**
 * POST /api/quotations/bulk
 * Perform bulk actions on quotations (Admin only)
 */
quotationsRoutes.post(
  '/bulk',
  requireAuth,
  requireAdmin,
  validateBody(bulkActionsSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { action, ids, status } = req.body;
      const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

      for (const id of ids) {
        try {
          const [quotation] = await db
            .select()
            .from(quotations)
            .where(eq(quotations.id, id));

          if (!quotation) {
            results.failed.push(id);
            continue;
          }

          switch (action) {
            case 'delete':
              // Delete associated items first (cascade should handle this but being explicit)
              await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
              await db.delete(quotations).where(eq(quotations.id, id));
              results.success.push(id);
              break;

            case 'send':
              // Only send draft quotations
              if (quotation.status !== 'draft') {
                results.failed.push(id);
                continue;
              }

              // Generate acceptance token
              const acceptanceToken = generateSecureToken(32);
              const tokenExpiresAt = new Date();
              tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

              await db
                .update(quotations)
                .set({
                  status: 'sent',
                  acceptanceToken,
                  tokenExpiresAt,
                  updatedAt: new Date(),
                })
                .where(eq(quotations.id, id));

              // Log activity
              await quotationActivityService.logSent(
                id,
                quotation.customerEmail,
                (req as { user?: { name?: string } }).user?.name
              ).catch(() => {}); // Non-blocking

              results.success.push(id);
              break;

            case 'changeStatus':
              if (!status) {
                results.failed.push(id);
                continue;
              }

              await db
                .update(quotations)
                .set({
                  status,
                  updatedAt: new Date(),
                })
                .where(eq(quotations.id, id));

              // Log activity
              await quotationActivityService.logStatusChanged(
                id,
                quotation.status,
                status,
                (req as { user?: { name?: string } }).user?.name
              ).catch(() => {}); // Non-blocking

              results.success.push(id);
              break;
          }
        } catch (error) {
          logger.error(`Bulk action ${action} failed for ${id}:`, error);
          results.failed.push(id);
        }
      }

      sendSuccess(res, {
        action,
        results,
        message: `Bulk ${action} completed: ${results.success.length} successful, ${results.failed.length} failed`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/quotations/:id
 * Get quotation details (Admin only)
 */
quotationsRoutes.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    sendSuccess(res, {
      ...quotation,
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      items: items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations
 * Create a new quotation (Admin only)
 */
quotationsRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createQuotationSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Generate quotation number
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotations);
      const qCount = countResult[0]?.count ?? 0;
      const quotationNumber = generateQuotationNumber(Number(qCount) + 1);

      // Calculate valid until date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (data.validDays || 30));

      // Process items and calculate totals
      const processedItems: Array<{
        productId: string | null;
        variantId?: string | null;
        name: string;
        description?: string;
        sku: string | null;
        quantity: number;
        unitPrice: number;
        isCustomItem: boolean;
      }> = [];

      let subtotal = 0;

      for (const item of data.items) {
        // Check if this is a product-based item or a custom item
        if (item.productId) {
          // Product-based item
          const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));

          if (!product) {
            throw new BadRequestError(`Product not found: ${item.productId}`);
          }

          let unitPrice = Number(product.basePrice);
          let sku = product.sku;
          let variantId: string | null = null;

          if (item.variantId) {
            const [variant] = await db
              .select()
              .from(productVariants)
              .where(eq(productVariants.id, item.variantId));

            if (variant) {
              unitPrice = Number(variant.basePrice);
              sku = variant.sku;
              variantId = variant.id;
            }
          }

          // Use custom price if provided (admin override)
          if (item.customPrice) {
            unitPrice = item.customPrice;
          }

          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;

          processedItems.push({
            productId: item.productId,
            variantId,
            name: product.name,
            description: product.description || undefined,
            sku,
            quantity: item.quantity,
            unitPrice,
            isCustomItem: false,
          });
        } else {
          // Custom item (no productId)
          const unitPrice = item.unitPrice!; // Already validated by schema
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;

          processedItems.push({
            productId: null,
            variantId: null,
            name: item.name!, // Already validated by schema
            description: item.description,
            sku: item.sku || null,
            quantity: item.quantity,
            unitPrice,
            isCustomItem: true,
          });
        }
      }

      // Apply discount
      let discountAmount = 0;
      if (data.discountValue && data.discountValue > 0) {
        if (data.discountType === 'percentage') {
          discountAmount = (subtotal * data.discountValue) / 100;
        } else {
          discountAmount = Math.min(data.discountValue, subtotal);
        }
      }

      // Get tax rate from settings
      const [taxSetting] = await db
        .select()
        .from(settings)
        .where(eq(settings.key, 'tax_rate'));
      const taxRate = taxSetting ? Number(taxSetting.value) : 0.11;

      // Calculate tax on discounted subtotal
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * taxRate;

      // Calculate total
      const total = taxableAmount + taxAmount;

      // Create quotation
      const quotationResult = await db
        .insert(quotations)
        .values({
          quotationNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail.toLowerCase(),
          customerPhone: data.customerPhone,
          customerCompany: data.customerCompany,
          status: 'draft',
          currency: 'USD',
          subtotal: String(subtotal),
          taxRate: String(taxRate),
          taxAmount: String(taxAmount),
          discountType: data.discountType,
          discountValue: data.discountValue ? String(data.discountValue) : null,
          discountAmount: String(discountAmount),
          total: String(total),
          validUntil,
          validDays: data.validDays || 30,
          notes: data.notes,
          termsAndConditions: data.terms,
        })
        .returning();
      const quotation = quotationResult[0];

      if (!quotation) {
        throw new BadRequestError('Failed to create quotation');
      }

      // Create quotation items
      for (const item of processedItems) {
        await db.insert(quotationItems).values({
          quotationId: quotation.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        });
      }

      // Log activity
      await quotationActivityService.logCreated(
        quotation.id,
        quotation.quotationNumber
      );

      sendCreated(res, {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/quotations/:id
 * Update quotation (Admin only)
 */
quotationsRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateQuotationSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, id));

      if (!existing) {
        throw new NotFoundError('Quotation not found');
      }

      // Only allow editing draft quotations
      if (existing.status !== 'draft') {
        throw new BadRequestError('Only draft quotations can be edited');
      }

      // Create revision before making changes
      await quotationRevisionService.createRevision(
        id,
        'Quotation updated',
        (req as { user?: { id?: string } }).user?.id,
        (req as { user?: { name?: string } }).user?.name
      ).catch(() => {}); // Non-blocking

      // Build update data object with proper field mappings
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Customer fields
      if (data.customerName !== undefined) updateData.customerName = data.customerName;
      if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail.toLowerCase();
      if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null;
      if (data.customerCompany !== undefined) updateData.customerCompany = data.customerCompany || null;

      // Status
      if (data.status !== undefined) updateData.status = data.status;

      // Notes and terms (map 'terms' to 'termsAndConditions')
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.terms !== undefined) updateData.termsAndConditions = data.terms || null;

      // Discount and tax fields
      if (data.discountType !== undefined) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined) updateData.discountValue = String(data.discountValue);
      if (data.taxRate !== undefined) updateData.taxRate = String(data.taxRate);

      // Update valid until if validDays provided
      if (data.validDays !== undefined) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + data.validDays);
        updateData.validUntil = validUntil;
      }

      // Recalculate totals if discount/tax changed or items updated
      const shouldRecalculate = data.discountType !== undefined ||
                                 data.discountValue !== undefined ||
                                 data.taxRate !== undefined ||
                                 (data.items && data.items.length > 0);

      // Handle items update if provided
      if (data.items && data.items.length > 0) {
        // Delete existing items
        await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));

        // Process new items and calculate new subtotal
        let subtotal = 0;
        const processedItems: Array<{
          productId: string | null;
          variantId?: string | null;
          name: string;
          description?: string;
          sku: string | null;
          quantity: number;
          unitPrice: number;
        }> = [];

        for (const item of data.items) {
          // Check if this is a product-based item or a custom item
          if (item.productId) {
            // Product-based item
            const [product] = await db
              .select()
              .from(products)
              .where(eq(products.id, item.productId));

            if (!product) {
              throw new BadRequestError(`Product not found: ${item.productId}`);
            }

            let unitPrice = Number(product.basePrice);
            let sku = product.sku;

            let variantId: string | null = null;
            if (item.variantId) {
              const [variant] = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.id, item.variantId));

              if (variant) {
                unitPrice = Number(variant.basePrice);
                sku = variant.sku;
                variantId = variant.id;
              }
            }

            // Use custom price if provided
            if (item.customPrice) {
              unitPrice = item.customPrice;
            }

            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;

            processedItems.push({
              productId: item.productId,
              variantId,
              name: product.name,
              description: product.description || undefined,
              sku,
              quantity: item.quantity,
              unitPrice,
            });
          } else {
            // Custom item (no productId)
            const unitPrice = item.unitPrice!; // Validated by schema
            const lineTotal = unitPrice * item.quantity;
            subtotal += lineTotal;

            processedItems.push({
              productId: null,
              variantId: null,
              name: item.name!, // Validated by schema
              description: item.description,
              sku: item.sku || null,
              quantity: item.quantity,
              unitPrice,
            });
          }
        }

        // Get discount and tax values (prefer new values, fallback to existing)
        const discountType = data.discountType ?? existing.discountType ?? 'percentage';
        const discountValue = data.discountValue ?? Number(existing.discountValue || 0);
        const taxRate = data.taxRate ?? Number(existing.taxRate || 0);

        // Calculate discount amount based on type
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = Math.min(discountValue, subtotal);
        }

        // Calculate tax and total
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;

        // Update pricing fields
        updateData.subtotal = String(subtotal);
        updateData.discountAmount = String(discountAmount);
        updateData.taxAmount = String(taxAmount);
        updateData.total = String(total);

        // Insert new items
        for (const item of processedItems) {
          await db.insert(quotationItems).values({
            quotationId: id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: String(item.unitPrice),
          });
        }
      } else if (shouldRecalculate) {
        // Recalculate totals based on existing items when only discount/tax changed
        const existingItems = await db
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.quotationId, id));

        const subtotal = existingItems.reduce((sum, item) => {
          return sum + Number(item.unitPrice) * item.quantity;
        }, 0);

        // Get discount and tax values
        const discountType = data.discountType ?? existing.discountType ?? 'percentage';
        const discountValue = data.discountValue ?? Number(existing.discountValue || 0);
        const taxRate = data.taxRate ?? Number(existing.taxRate || 0);

        // Calculate discount amount based on type
        let discountAmount = 0;
        if (discountType === 'percentage') {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = Math.min(discountValue, subtotal);
        }

        // Calculate tax and total
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * taxRate;
        const total = taxableAmount + taxAmount;

        // Update pricing fields
        updateData.subtotal = String(subtotal);
        updateData.discountAmount = String(discountAmount);
        updateData.taxAmount = String(taxAmount);
        updateData.total = String(total);
      }

      const quotationResult = await db
        .update(quotations)
        .set(updateData)
        .where(eq(quotations.id, id))
        .returning();
      const quotation = quotationResult[0];

      if (!quotation) {
        throw new NotFoundError('Quotation not found');
      }

      // Fetch updated items
      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, id));

      sendSuccess(res, {
        ...quotation,
        subtotal: Number(quotation.subtotal),
        taxRate: Number(quotation.taxRate || 0),
        taxAmount: Number(quotation.taxAmount || 0),
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
        items: items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.unitPrice) * item.quantity,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/quotations/:id
 * Delete quotation (Admin only)
 */
quotationsRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: quotations.id, status: quotations.status })
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!existing) {
      throw new NotFoundError('Quotation not found');
    }

    // Only allow deletion of draft quotations
    if (existing.status !== 'draft') {
      throw new BadRequestError('Only draft quotations can be deleted');
    }

    // Delete items first
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));

    // Delete quotation
    await db.delete(quotations).where(eq(quotations.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id/activities
 * Get activity timeline for a quotation (Admin only)
 */
quotationsRoutes.get('/:id/activities', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;

    const activities = await quotationActivityService.getActivities(id);

    sendSuccess(res, activities);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id/revisions
 * Get revision history for a quotation (Admin only)
 */
quotationsRoutes.get('/:id/revisions', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const revisions = await quotationRevisionService.getRevisions(id);
    sendSuccess(res, revisions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id/revisions/:revisionId
 * Get a specific revision (Admin only)
 */
quotationsRoutes.get('/:id/revisions/:revisionId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const revisionId = req.params['revisionId'] as string;
    const revision = await quotationRevisionService.getRevision(revisionId);

    if (!revision) {
      throw new NotFoundError('Revision not found');
    }

    sendSuccess(res, revision);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/:id/revisions/:revisionId/restore
 * Restore a quotation to a previous revision (Admin only)
 */
quotationsRoutes.post('/:id/revisions/:revisionId/restore', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const revisionId = req.params['revisionId'] as string;

    const success = await quotationRevisionService.restoreRevision(
      id,
      revisionId,
      (req as { user?: { id?: string } }).user?.id,
      (req as { user?: { name?: string } }).user?.name
    );

    if (!success) {
      throw new NotFoundError('Revision not found or does not belong to this quotation');
    }

    // Log activity
    await quotationActivityService.logUpdated(id, '', ['Restored from previous version']).catch(() => {});

    sendSuccess(res, { message: 'Quotation restored from revision successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id/revisions/:revisionId/compare
 * Compare a revision with current state or another revision (Admin only)
 * Query param: ?compareWith=<revisionId> to compare with another revision
 */
quotationsRoutes.get('/:id/revisions/:revisionId/compare', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const revisionId = req.params['revisionId'] as string;
    const compareWith = req.query.compareWith as string | undefined;

    const comparison = await quotationRevisionService.compareRevisions(id, revisionId, compareWith);

    if (!comparison) {
      throw new NotFoundError('Revision not found');
    }

    sendSuccess(res, comparison);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/:id/pdf
 * Generate and download quotation PDF (Admin only)
 * Optional query param: ?templateId=<uuid> to use specific template
 */
quotationsRoutes.get('/:id/pdf', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const templateId = req.query.templateId as string | undefined;

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    // Get company settings
    const companySettings = await db
      .select()
      .from(settings)
      .where(
        or(
          eq(settings.key, 'company_name'),
          eq(settings.key, 'company_address'),
          eq(settings.key, 'company_phone'),
          eq(settings.key, 'company_email'),
          eq(settings.key, 'company_website'),
          eq(settings.key, 'quotation_terms')
        )
      );

    const settingsMap = new Map<string, string>(companySettings.map(s => [s.key, s.value as string]));

    // Get PDF template (use specified, quotation's template, or default)
    let template = null;

    if (templateId) {
      [template] = await db
        .select()
        .from(pdfTemplates)
        .where(eq(pdfTemplates.id, templateId));
    } else if (quotation.pdfTemplateId) {
      [template] = await db
        .select()
        .from(pdfTemplates)
        .where(eq(pdfTemplates.id, quotation.pdfTemplateId));
    } else {
      // Get default template
      [template] = await db
        .select()
        .from(pdfTemplates)
        .where(eq(pdfTemplates.isDefault, true))
        .limit(1);
    }

    // Build template config for PDF service
    const templateConfig = template ? {
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
      logoUrl: template.logoUrl || undefined,
      showCompanyLogo: template.showCompanyLogo,
      showLineItemImages: template.showLineItemImages,
      showLineItemDescription: template.showLineItemDescription,
      showSku: template.showSku,
      headerText: template.headerText || undefined,
      footerText: template.footerText || undefined,
      thankYouMessage: template.thankYouMessage || undefined,
    } : undefined;

    // Generate PDF
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      validUntil: quotation.validUntil!,
      status: quotation.status,

      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || undefined,
      customerCompany: quotation.customerCompany || undefined,

      items: items.map(item => ({
        productName: item.name,
        sku: item.sku || '',
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
        variantOptions: undefined,
      })),

      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0, // Not in schema
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,

      notes: quotation.notes || undefined,
      terms: quotation.termsAndConditions || settingsMap.get('quotation_terms') || undefined,

      companyName: settingsMap.get('company_name') || 'Lab404 Electronics',
      companyAddress: settingsMap.get('company_address') || '',
      companyPhone: settingsMap.get('company_phone') || '',
      companyEmail: settingsMap.get('company_email') || '',
      companyWebsite: settingsMap.get('company_website') || undefined,
    }, templateConfig);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${quotation.quotationNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/:id/send
 * Send quotation to customer via email (Admin only)
 */
quotationsRoutes.post('/:id/send', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.status !== 'draft') {
      throw new BadRequestError('Only draft quotations can be sent');
    }

    // Get quotation items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    // Get company settings
    const settingsRows = await db
      .select()
      .from(settings)
      .where(
        or(
          eq(settings.key, 'company_name'),
          eq(settings.key, 'company_email'),
          eq(settings.key, 'company_phone'),
          eq(settings.key, 'company_address'),
          eq(settings.key, 'company_website'),
          eq(settings.key, 'quotation_terms')
        )
      );

    const settingsMap = new Map(settingsRows.map(s => [s.key, s.value]));

    // Get PDF template config if exists
    let templateConfig = {};
    if (quotation.pdfTemplateId) {
      const [template] = await db
        .select()
        .from(pdfTemplates)
        .where(eq(pdfTemplates.id, quotation.pdfTemplateId));
      if (template) {
        templateConfig = {
          primaryColor: template.primaryColor || undefined,
          accentColor: template.accentColor || undefined,
          logoUrl: template.logoUrl || undefined,
          showCompanyLogo: template.showCompanyLogo ?? true,
          showLineItemImages: template.showLineItemImages ?? false,
          headerText: template.headerText || undefined,
          footerText: template.footerText || undefined,
        };
      }
    }

    const companyName = settingsMap.get('company_name') || 'Lab404 Electronics';
    const companyEmail = settingsMap.get('company_email') || undefined;
    const companyPhone = settingsMap.get('company_phone') || undefined;

    // Generate PDF
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || undefined,
      customerCompany: quotation.customerCompany || undefined,
      customerAddress: quotation.customerAddress as Record<string, string> | undefined,

      status: quotation.status,
      validUntil: quotation.validUntil || undefined,
      createdAt: quotation.createdAt,

      items: items.map(item => ({
        productName: item.name,
        description: item.description || undefined,
        sku: item.sku || undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),

      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0,
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,

      notes: quotation.notes || undefined,
      terms: quotation.termsAndConditions || settingsMap.get('quotation_terms') || undefined,

      companyName,
      companyAddress: settingsMap.get('company_address') || '',
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || '',
      companyWebsite: settingsMap.get('company_website') || undefined,
    }, templateConfig);

    // Send email with PDF attachment
    const emailSent = await notificationService.sendQuotationToCustomer(
      {
        quotationNumber: quotation.quotationNumber,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        total: Number(quotation.total),
        validUntil: quotation.validUntil,
        currency: quotation.currency,
        itemCount: items.length,
        companyName,
        companyEmail,
        companyPhone,
      },
      pdfBuffer
    );

    if (!emailSent) {
      logger.warn('Email not sent - SMTP may not be configured', {
        quotationId: id,
        customerEmail: quotation.customerEmail,
      });
    }

    // Generate acceptance token (valid for 30 days)
    const acceptanceToken = generateSecureToken(32);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

    // Calculate validUntil from NOW + quotation's validDays
    // This ensures the expiry countdown starts when the quotation is sent
    const validDays = quotation.validDays || 30;
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + validDays);

    // Update status to sent, recalculate validUntil, and add acceptance token
    await db
      .update(quotations)
      .set({
        status: 'sent',
        validUntil: newValidUntil,
        acceptanceToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, id));

    // Log activity
    await quotationActivityService.logSent(id, quotation.customerEmail);

    // Generate acceptance link
    const baseUrl = process.env['WEB_APP_URL'] || 'http://localhost:3000';
    const acceptanceLink = `${baseUrl}/quotations/view/${acceptanceToken}`;

    sendSuccess(res, {
      message: emailSent ? 'Quotation sent successfully' : 'Quotation marked as sent (email not configured)',
      emailSent,
      quotationNumber: quotation.quotationNumber,
      sentTo: quotation.customerEmail,
      acceptanceLink,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/:id/convert-to-order
 * Convert accepted quotation to order (Admin only)
 */
quotationsRoutes.post('/:id/convert-to-order', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.status !== 'accepted') {
      throw new BadRequestError('Only accepted quotations can be converted to orders');
    }

    if (quotation.convertedToOrderId) {
      throw new BadRequestError('Quotation has already been converted to an order');
    }

    // TODO: Implement order creation from quotation
    // This would involve creating an order with the quotation's items and pricing

    sendSuccess(res, {
      message: 'Order creation from quotation not yet implemented',
      quotationId: quotation.id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/:id/duplicate
 * Duplicate a quotation (Admin only)
 */
quotationsRoutes.post('/:id/duplicate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [original] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));

    if (!original) {
      throw new NotFoundError('Quotation not found');
    }

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, id));

    // Generate new quotation number
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations);
    const count = countResult[0]?.count ?? 0;
    const quotationNumber = generateQuotationNumber(Number(count) + 1);

    // Calculate new valid until
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create new quotation
    const [newQuotation] = await db
      .insert(quotations)
      .values({
        quotationNumber,
        customerId: original.customerId,
        customerName: original.customerName,
        customerEmail: original.customerEmail,
        customerPhone: original.customerPhone,
        customerCompany: original.customerCompany,
        status: 'draft',
        currency: original.currency,
        subtotal: original.subtotal,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        discountAmount: original.discountAmount,
        total: original.total,
        validUntil,
        notes: original.notes,
        termsAndConditions: original.termsAndConditions,
      })
      .returning();

    if (!newQuotation) {
      throw new BadRequestError('Failed to create quotation');
    }

    // Copy items
    for (const item of items) {
      await db.insert(quotationItems).values({
        quotationId: newQuotation.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    // Log activities for both original and new quotation
    await quotationActivityService.logDuplicated(
      original.id,
      newQuotation.id,
      newQuotation.quotationNumber
    );
    await quotationActivityService.logCreated(
      newQuotation.id,
      newQuotation.quotationNumber
    );

    sendCreated(res, {
      id: newQuotation.id,
      quotationNumber: newQuotation.quotationNumber,
      status: newQuotation.status,
      total: Number(newQuotation.total),
      validUntil: newQuotation.validUntil,
      duplicatedFrom: original.quotationNumber,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Public Routes (No Authentication Required)
// ===========================================

/**
 * GET /api/quotations/public/:token
 * View quotation by acceptance token (Public - no auth)
 */
quotationsRoutes.get('/public/:token', async (req, res, next) => {
  try {
    const db = getDb();
    const token = req.params['token'] as string;

    if (!token || token.length !== 64) {
      throw new BadRequestError('Invalid token');
    }

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.acceptanceToken, token));

    if (!quotation) {
      throw new NotFoundError('Quotation not found or link has expired');
    }

    // Check if token has expired
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < new Date()) {
      throw new BadRequestError('This quotation link has expired');
    }

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotation.id));

    // Update viewedAt if not already viewed
    if (!quotation.viewedAt) {
      await db
        .update(quotations)
        .set({ viewedAt: new Date() })
        .where(eq(quotations.id, quotation.id));

      // Log activity
      await quotationActivityService.logViewed(quotation.id, quotation.customerName);
    }

    // Get company settings
    const settingsRows = await db
      .select()
      .from(settings)
      .where(
        or(
          eq(settings.key, 'company_name'),
          eq(settings.key, 'company_email'),
          eq(settings.key, 'company_phone'),
          eq(settings.key, 'company_address'),
          eq(settings.key, 'company_website')
        )
      );

    const settingsMap = new Map(settingsRows.map(s => [s.key, s.value]));

    sendSuccess(res, {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      status: quotation.status,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerCompany: quotation.customerCompany,

      items: items.map(item => ({
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),

      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,

      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      validUntil: quotation.validUntil,
      createdAt: quotation.createdAt,

      company: {
        name: settingsMap.get('company_name') || 'Lab404 Electronics',
        email: settingsMap.get('company_email'),
        phone: settingsMap.get('company_phone'),
        address: settingsMap.get('company_address'),
        website: settingsMap.get('company_website'),
      },

      canAccept: quotation.status === 'sent',
      canReject: quotation.status === 'sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotations/public/:token/accept
 * Accept quotation (Public - no auth)
 */
quotationsRoutes.post('/public/:token/accept', async (req, res, next) => {
  try {
    const db = getDb();
    const token = req.params['token'] as string;

    if (!token || token.length !== 64) {
      throw new BadRequestError('Invalid token');
    }

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.acceptanceToken, token));

    if (!quotation) {
      throw new NotFoundError('Quotation not found or link has expired');
    }

    // Check if token has expired
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < new Date()) {
      throw new BadRequestError('This quotation link has expired');
    }

    if (quotation.status !== 'sent') {
      throw new BadRequestError(`Quotation cannot be accepted (current status: ${quotation.status})`);
    }

    // Update status to accepted
    await db
      .update(quotations)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotation.id));

    // Log activity
    await quotationActivityService.logAccepted(quotation.id, quotation.customerName);

    sendSuccess(res, {
      message: 'Quotation accepted successfully',
      quotationNumber: quotation.quotationNumber,
      status: 'accepted',
    });
  } catch (error) {
    next(error);
  }
});

const rejectQuotationSchema = z.object({
  reason: z.string().max(1000).optional(),
});

/**
 * POST /api/quotations/public/:token/reject
 * Reject quotation (Public - no auth)
 */
quotationsRoutes.post('/public/:token/reject', validateBody(rejectQuotationSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const token = req.params['token'] as string;
    const { reason } = req.body;

    if (!token || token.length !== 64) {
      throw new BadRequestError('Invalid token');
    }

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.acceptanceToken, token));

    if (!quotation) {
      throw new NotFoundError('Quotation not found or link has expired');
    }

    // Check if token has expired
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < new Date()) {
      throw new BadRequestError('This quotation link has expired');
    }

    if (quotation.status !== 'sent') {
      throw new BadRequestError(`Quotation cannot be rejected (current status: ${quotation.status})`);
    }

    // Update status to rejected
    await db
      .update(quotations)
      .set({
        status: 'rejected',
        notes: reason ? `${quotation.notes || ''}\n\nRejection reason: ${reason}`.trim() : quotation.notes,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotation.id));

    // Log activity
    await quotationActivityService.logRejected(quotation.id, reason, quotation.customerName);

    sendSuccess(res, {
      message: 'Quotation rejected',
      quotationNumber: quotation.quotationNumber,
      status: 'rejected',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotations/public/:token/pdf
 * Download quotation PDF (Public - no auth)
 */
quotationsRoutes.get('/public/:token/pdf', async (req, res, next) => {
  try {
    const db = getDb();
    const token = req.params['token'] as string;

    if (!token || token.length !== 64) {
      throw new BadRequestError('Invalid token');
    }

    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.acceptanceToken, token));

    if (!quotation) {
      throw new NotFoundError('Quotation not found or link has expired');
    }

    // Check if token has expired
    if (quotation.tokenExpiresAt && new Date(quotation.tokenExpiresAt) < new Date()) {
      throw new BadRequestError('This quotation link has expired');
    }

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotation.id));

    // Get company settings
    const settingsRows = await db
      .select()
      .from(settings)
      .where(
        or(
          eq(settings.key, 'company_name'),
          eq(settings.key, 'company_email'),
          eq(settings.key, 'company_phone'),
          eq(settings.key, 'company_address'),
          eq(settings.key, 'company_website'),
          eq(settings.key, 'quotation_terms')
        )
      );

    const settingsMap = new Map(settingsRows.map(s => [s.key, s.value]));

    // Generate PDF
    const pdfBuffer = await pdfService.generateQuotationPDF({
      quotationNumber: quotation.quotationNumber,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone || undefined,
      customerCompany: quotation.customerCompany || undefined,
      customerAddress: quotation.customerAddress as Record<string, string> | undefined,

      status: quotation.status,
      validUntil: quotation.validUntil || undefined,
      createdAt: quotation.createdAt,

      items: items.map(item => ({
        productName: item.name,
        description: item.description || undefined,
        sku: item.sku || undefined,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.unitPrice) * item.quantity,
      })),

      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate || 0),
      taxAmount: Number(quotation.taxAmount || 0),
      shippingAmount: 0,
      discountAmount: Number(quotation.discountAmount),
      total: Number(quotation.total),
      currency: quotation.currency,

      notes: quotation.notes || undefined,
      terms: quotation.termsAndConditions || settingsMap.get('quotation_terms') || undefined,

      companyName: settingsMap.get('company_name') || 'Lab404 Electronics',
      companyAddress: settingsMap.get('company_address') || '',
      companyPhone: settingsMap.get('company_phone') || '',
      companyEmail: settingsMap.get('company_email') || '',
      companyWebsite: settingsMap.get('company_website') || undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});
