import { Router } from 'express';
import { z } from 'zod';
import { getDb, quotationTemplates, eq, desc } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const quotationTemplatesRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const templateItemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sku: z.string().max(100).optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  items: z.array(templateItemSchema).min(1),
  defaultDiscount: z.number().min(0).optional(),
  defaultDiscountType: z.enum(['percentage', 'fixed']).optional(),
  defaultTaxRate: z.number().min(0).max(1).optional(),
  defaultValidDays: z.number().int().min(1).max(365).optional(),
  defaultTerms: z.string().max(5000).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  items: z.array(templateItemSchema).min(1).optional(),
  defaultDiscount: z.number().min(0).optional().nullable(),
  defaultDiscountType: z.enum(['percentage', 'fixed']).optional().nullable(),
  defaultTaxRate: z.number().min(0).max(1).optional().nullable(),
  defaultValidDays: z.number().int().min(1).max(365).optional(),
  defaultTerms: z.string().max(5000).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ===========================================
// Routes
// ===========================================

/**
 * GET /api/quotation-templates
 * List all quotation templates (Admin only)
 */
quotationTemplatesRoutes.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const activeOnly = req.query['activeOnly'] !== 'false';

    const baseQuery = db.select().from(quotationTemplates);

    const templates = activeOnly
      ? await baseQuery.where(eq(quotationTemplates.isActive, 1)).orderBy(desc(quotationTemplates.createdAt))
      : await baseQuery.orderBy(desc(quotationTemplates.createdAt));

    sendSuccess(res, templates.map(t => ({
      ...t,
      defaultDiscount: t.defaultDiscount ? Number(t.defaultDiscount) : null,
      defaultTaxRate: t.defaultTaxRate ? Number(t.defaultTaxRate) : null,
      isActive: Boolean(t.isActive),
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/quotation-templates/:id
 * Get template details (Admin only)
 */
quotationTemplatesRoutes.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [template] = await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, id));

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    sendSuccess(res, {
      ...template,
      defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
      defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
      isActive: Boolean(template.isActive),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/quotation-templates
 * Create a new template (Admin only)
 */
quotationTemplatesRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createTemplateSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      const [template] = await db
        .insert(quotationTemplates)
        .values({
          name: data['name'],
          description: data['description'],
          items: data['items'],
          defaultDiscount: data['defaultDiscount'] ? String(data['defaultDiscount']) : null,
          defaultDiscountType: data['defaultDiscountType'],
          defaultTaxRate: data['defaultTaxRate'] ? String(data['defaultTaxRate']) : null,
          defaultValidDays: data['defaultValidDays'],
          defaultTerms: data['defaultTerms'],
        })
        .returning();

      if (!template) {
        throw new NotFoundError('Failed to create template');
      }

      sendCreated(res, {
        ...template,
        defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
        defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
        isActive: Boolean(template.isActive),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/quotation-templates/:id
 * Update a template (Admin only)
 */
quotationTemplatesRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select()
        .from(quotationTemplates)
        .where(eq(quotationTemplates.id, id));

      if (!existing) {
        throw new NotFoundError('Template not found');
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data['name'] !== undefined) {updateData['name'] = data['name'];}
      if (data['description'] !== undefined) {updateData['description'] = data['description'];}
      if (data['items'] !== undefined) {updateData['items'] = data['items'];}
      if (data['defaultDiscount'] !== undefined) {
        updateData['defaultDiscount'] = data['defaultDiscount'] !== null ? String(data['defaultDiscount']) : null;
      }
      if (data['defaultDiscountType'] !== undefined) {updateData['defaultDiscountType'] = data['defaultDiscountType'];}
      if (data['defaultTaxRate'] !== undefined) {
        updateData['defaultTaxRate'] = data['defaultTaxRate'] !== null ? String(data['defaultTaxRate']) : null;
      }
      if (data['defaultValidDays'] !== undefined) {updateData['defaultValidDays'] = data['defaultValidDays'];}
      if (data['defaultTerms'] !== undefined) {updateData['defaultTerms'] = data['defaultTerms'];}
      if (data['isActive'] !== undefined) {updateData['isActive'] = data['isActive'] ? 1 : 0;}

      const [template] = await db
        .update(quotationTemplates)
        .set(updateData)
        .where(eq(quotationTemplates.id, id))
        .returning();

      if (!template) {
        throw new NotFoundError('Template not found');
      }

      sendSuccess(res, {
        ...template,
        defaultDiscount: template.defaultDiscount ? Number(template.defaultDiscount) : null,
        defaultTaxRate: template.defaultTaxRate ? Number(template.defaultTaxRate) : null,
        isActive: Boolean(template.isActive),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/quotation-templates/:id
 * Delete a template (Admin only)
 */
quotationTemplatesRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.id, id));

    if (!existing) {
      throw new NotFoundError('Template not found');
    }

    await db.delete(quotationTemplates).where(eq(quotationTemplates.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
