import { Router } from 'express';
import { z } from 'zod';
import { getDb, promoCodes, eq, sql, desc, and, gte, lte, or, like } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

export const promoCodesRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(50).transform(s => s.toUpperCase()),
  description: z.string().max(500).optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().positive(),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerCustomer: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().optional().default(true),
});

const updatePromoCodeSchema = createPromoCodeSchema.partial().omit({ code: true });

const promoCodeFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  status: z.enum(['active', 'expired', 'upcoming']).optional(),
});

// ===========================================
// Public Routes
// ===========================================

/**
 * POST /api/promo-codes/validate
 * Validate a promo code (public endpoint for cart)
 */
promoCodesRoutes.post(
  '/validate',
  validateBody(z.object({ code: z.string().min(1), orderAmount: z.number().min(0) })),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { code, orderAmount } = req.body;

      const [promoCode] = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, code.toUpperCase()));

      if (!promoCode) {
        throw new BadRequestError('Invalid promo code');
      }

      // Check if active
      if (!promoCode.isActive) {
        throw new BadRequestError('Promo code is not active');
      }

      // Check dates
      const now = new Date();
      if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
        throw new BadRequestError('Promo code is not yet valid');
      }
      if (promoCode.expiresAt && new Date(promoCode.expiresAt) < now) {
        throw new BadRequestError('Promo code has expired');
      }

      // Check usage limit
      if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
        throw new BadRequestError('Promo code usage limit reached');
      }

      // Check minimum order amount
      if (promoCode.minimumOrderAmount && orderAmount < Number(promoCode.minimumOrderAmount)) {
        throw new BadRequestError(
          `Minimum order amount of $${promoCode.minimumOrderAmount} required`
        );
      }

      // Calculate discount
      let discountAmount: number;
      if (promoCode.discountType === 'percentage') {
        discountAmount = (orderAmount * Number(promoCode.discountValue)) / 100;
        // Apply maximum discount cap if set
        if (promoCode.maximumDiscountAmount) {
          discountAmount = Math.min(discountAmount, Number(promoCode.maximumDiscountAmount));
        }
      } else {
        discountAmount = Math.min(Number(promoCode.discountValue), orderAmount);
      }

      sendSuccess(res, {
        valid: true,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: Number(promoCode.discountValue),
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: promoCode.description,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/promo-codes
 * List all promo codes (Admin only)
 */
promoCodesRoutes.get(
  '/',
  requireAuth,
  requireAdmin,
  validateQuery(promoCodeFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const { search, isActive, status } = req.query;

      const conditions = [];
      const now = new Date();

      if (search) {
        conditions.push(
          or(
            like(promoCodes.code, `%${(search as string).toUpperCase()}%`),
            like(promoCodes.description, `%${search}%`)
          )
        );
      }

      if (isActive !== undefined) {
        conditions.push(eq(promoCodes.isActive, isActive === 'true'));
      }

      if (status === 'active') {
        conditions.push(eq(promoCodes.isActive, true));
        conditions.push(
          or(
            sql`${promoCodes.startsAt} IS NULL`,
            lte(promoCodes.startsAt, now)
          )
        );
        conditions.push(
          or(
            sql`${promoCodes.expiresAt} IS NULL`,
            gte(promoCodes.expiresAt, now)
          )
        );
      } else if (status === 'expired') {
        conditions.push(lte(promoCodes.expiresAt, now));
      } else if (status === 'upcoming') {
        conditions.push(gte(promoCodes.startsAt, now));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(promoCodes)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

      const promoCodeList = await db
        .select()
        .from(promoCodes)
        .where(whereClause)
        .orderBy(desc(promoCodes.createdAt))
        .limit(limit)
        .offset(offset);

      const formattedList = promoCodeList.map(pc => ({
        ...pc,
        discountValue: Number(pc.discountValue),
        minimumOrderAmount: pc.minimumOrderAmount ? Number(pc.minimumOrderAmount) : null,
        maximumDiscountAmount: pc.maximumDiscountAmount ? Number(pc.maximumDiscountAmount) : null,
        isExpired: pc.expiresAt ? new Date(pc.expiresAt) < now : false,
        isUpcoming: pc.startsAt ? new Date(pc.startsAt) > now : false,
      }));

      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/promo-codes/:id
 * Get promo code details (Admin only)
 */
promoCodesRoutes.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [promoCode] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));

    if (!promoCode) {
      throw new NotFoundError('Promo code not found');
    }

    sendSuccess(res, {
      ...promoCode,
      discountValue: Number(promoCode.discountValue),
      minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
      maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/promo-codes
 * Create a new promo code (Admin only)
 */
promoCodesRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createPromoCodeSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Check if code already exists
      const [existing] = await db
        .select({ id: promoCodes.id })
        .from(promoCodes)
        .where(eq(promoCodes.code, data.code));

      if (existing) {
        throw new ConflictError('Promo code already exists');
      }

      // Validate percentage discount
      if (data.discountType === 'percentage' && data.discountValue > 100) {
        throw new BadRequestError('Percentage discount cannot exceed 100%');
      }

      // Validate dates
      if (data.startsAt && data.expiresAt) {
        if (new Date(data.startsAt) >= new Date(data.expiresAt)) {
          throw new BadRequestError('Start date must be before expiry date');
        }
      }

      const promoCodeResult = await db
        .insert(promoCodes)
        .values({
          ...data,
          startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        })
        .returning();
      const promoCode = promoCodeResult[0];

      if (!promoCode) {
        throw new BadRequestError('Failed to create promo code');
      }

      sendCreated(res, {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
        maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/promo-codes/:id
 * Update a promo code (Admin only)
 */
promoCodesRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updatePromoCodeSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.id, id));

      if (!existing) {
        throw new NotFoundError('Promo code not found');
      }

      // Validate percentage discount
      if (data.discountType === 'percentage' && data.discountValue && data.discountValue > 100) {
        throw new BadRequestError('Percentage discount cannot exceed 100%');
      }

      // Validate dates
      const startsAt = data.startsAt ? new Date(data.startsAt) : existing.startsAt;
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt;
      if (startsAt && expiresAt && startsAt >= expiresAt) {
        throw new BadRequestError('Start date must be before expiry date');
      }

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      if (data['startsAt']) {
        updateData['startsAt'] = new Date(data['startsAt'] as string);
      }
      if (data['expiresAt']) {
        updateData['expiresAt'] = new Date(data['expiresAt'] as string);
      }

      const promoCodeResult = await db
        .update(promoCodes)
        .set(updateData)
        .where(eq(promoCodes.id, id))
        .returning();
      const promoCode = promoCodeResult[0];

      if (!promoCode) {
        throw new NotFoundError('Promo code not found');
      }

      sendSuccess(res, {
        ...promoCode,
        discountValue: Number(promoCode.discountValue),
        minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
        maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/promo-codes/:id
 * Delete a promo code (Admin only)
 */
promoCodesRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: promoCodes.id, usageCount: promoCodes.usageCount })
      .from(promoCodes)
      .where(eq(promoCodes.id, id));

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    // Prevent deletion if code has been used
    if (existing.usageCount > 0) {
      throw new BadRequestError(
        'Cannot delete promo code that has been used. Consider deactivating it instead.'
      );
    }

    await db.delete(promoCodes).where(eq(promoCodes.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/promo-codes/:id/toggle
 * Toggle promo code active status (Admin only)
 */
promoCodesRoutes.post('/:id/toggle', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));

    if (!existing) {
      throw new NotFoundError('Promo code not found');
    }

    const promoCodeResult = await db
      .update(promoCodes)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(promoCodes.id, id))
      .returning();
    const promoCode = promoCodeResult[0];

    if (!promoCode) {
      throw new NotFoundError('Promo code not found');
    }

    sendSuccess(res, {
      ...promoCode,
      discountValue: Number(promoCode.discountValue),
      minimumOrderAmount: promoCode.minimumOrderAmount ? Number(promoCode.minimumOrderAmount) : null,
      maximumDiscountAmount: promoCode.maximumDiscountAmount ? Number(promoCode.maximumDiscountAmount) : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/promo-codes/stats/summary
 * Get promo code usage statistics (Admin only)
 */
promoCodesRoutes.get('/stats/summary', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const now = new Date();

    // Total promo codes
    const totalResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(promoCodes);
    const total = totalResult[0]?.total ?? 0;

    // Active promo codes
    const activeResult = await db
      .select({ active: sql<number>`count(*)` })
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.isActive, true),
          or(
            sql`${promoCodes.startsAt} IS NULL`,
            lte(promoCodes.startsAt, now)
          ),
          or(
            sql`${promoCodes.expiresAt} IS NULL`,
            gte(promoCodes.expiresAt, now)
          )
        )
      );
    const active = activeResult[0]?.active ?? 0;

    // Total usage
    const usageResult = await db
      .select({ totalUsage: sql<number>`COALESCE(sum(${promoCodes.usageCount}), 0)` })
      .from(promoCodes);
    const totalUsage = usageResult[0]?.totalUsage ?? 0;

    // Most used promo codes
    const topCodes = await db
      .select({
        code: promoCodes.code,
        usageCount: promoCodes.usageCount,
        discountType: promoCodes.discountType,
        discountValue: promoCodes.discountValue,
      })
      .from(promoCodes)
      .where(sql`${promoCodes.usageCount} > 0`)
      .orderBy(desc(promoCodes.usageCount))
      .limit(5);

    sendSuccess(res, {
      total: Number(total),
      active: Number(active),
      expired: Number(total) - Number(active),
      totalUsage: Number(totalUsage),
      topCodes: topCodes.map(c => ({
        ...c,
        discountValue: Number(c.discountValue),
      })),
    });
  } catch (error) {
    next(error);
  }
});
