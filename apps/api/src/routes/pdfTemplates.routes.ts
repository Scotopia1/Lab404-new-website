import { Router } from 'express';
import { z } from 'zod';
import { getDb, pdfTemplates, eq, desc, sql } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const pdfTemplatesRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
  logoUrl: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#1a1a2e'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#0066cc'),
  showCompanyLogo: z.boolean().optional().default(true),
  showLineItemImages: z.boolean().optional().default(false),
  showLineItemDescription: z.boolean().optional().default(false),
  showSku: z.boolean().optional().default(true),
  headerText: z.string().max(500).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  thankYouMessage: z.string().max(500).optional().nullable(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  logoUrl: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  showCompanyLogo: z.boolean().optional(),
  showLineItemImages: z.boolean().optional(),
  showLineItemDescription: z.boolean().optional(),
  showSku: z.boolean().optional(),
  headerText: z.string().max(500).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  thankYouMessage: z.string().max(500).optional().nullable(),
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/pdf-templates
 * Get all PDF templates (Admin only)
 */
pdfTemplatesRoutes.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pdfTemplates);
    const count = countResult[0]?.count ?? 0;

    const templates = await db
      .select()
      .from(pdfTemplates)
      .orderBy(desc(pdfTemplates.isDefault), desc(pdfTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    sendSuccess(res, templates, 200, createPaginationMeta(page, limit, Number(count)));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdf-templates/default
 * Get the default PDF template (Admin only)
 */
pdfTemplatesRoutes.get('/default', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const db = getDb();

    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.isDefault, true))
      .limit(1);

    if (!template) {
      // Return default built-in values
      return sendSuccess(res, {
        id: null,
        name: 'Default Template',
        isDefault: true,
        primaryColor: '#1a1a2e',
        accentColor: '#0066cc',
        showCompanyLogo: true,
        showLineItemImages: false,
        showLineItemDescription: false,
        showSku: true,
        headerText: null,
        footerText: null,
        thankYouMessage: null,
      });
    }

    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdf-templates/:id
 * Get single PDF template (Admin only)
 */
pdfTemplatesRoutes.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [template] = await db
      .select()
      .from(pdfTemplates)
      .where(eq(pdfTemplates.id, id));

    if (!template) {
      throw new NotFoundError('PDF template not found');
    }

    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pdf-templates
 * Create new PDF template (Admin only)
 */
pdfTemplatesRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createTemplateSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // If this is being set as default, unset other defaults
      if (data.isDefault) {
        await db
          .update(pdfTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(pdfTemplates.isDefault, true));
      }

      const [template] = await db
        .insert(pdfTemplates)
        .values({
          name: data.name,
          isDefault: data.isDefault || false,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor || '#1a1a2e',
          accentColor: data.accentColor || '#0066cc',
          showCompanyLogo: data.showCompanyLogo ?? true,
          showLineItemImages: data.showLineItemImages ?? false,
          showLineItemDescription: data.showLineItemDescription ?? false,
          showSku: data.showSku ?? true,
          headerText: data.headerText,
          footerText: data.footerText,
          thankYouMessage: data.thankYouMessage,
        })
        .returning();

      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/pdf-templates/:id
 * Update PDF template (Admin only)
 */
pdfTemplatesRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      // Check exists
      const [existing] = await db
        .select({ id: pdfTemplates.id })
        .from(pdfTemplates)
        .where(eq(pdfTemplates.id, id));

      if (!existing) {
        throw new NotFoundError('PDF template not found');
      }

      // If this is being set as default, unset other defaults
      if (data.isDefault) {
        await db
          .update(pdfTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(pdfTemplates.isDefault, true));
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) {updateData.name = data.name;}
      if (data.isDefault !== undefined) {updateData.isDefault = data.isDefault;}
      if (data.logoUrl !== undefined) {updateData.logoUrl = data.logoUrl;}
      if (data.primaryColor !== undefined) {updateData.primaryColor = data.primaryColor;}
      if (data.accentColor !== undefined) {updateData.accentColor = data.accentColor;}
      if (data.showCompanyLogo !== undefined) {updateData.showCompanyLogo = data.showCompanyLogo;}
      if (data.showLineItemImages !== undefined) {updateData.showLineItemImages = data.showLineItemImages;}
      if (data.showLineItemDescription !== undefined) {updateData.showLineItemDescription = data.showLineItemDescription;}
      if (data.showSku !== undefined) {updateData.showSku = data.showSku;}
      if (data.headerText !== undefined) {updateData.headerText = data.headerText;}
      if (data.footerText !== undefined) {updateData.footerText = data.footerText;}
      if (data.thankYouMessage !== undefined) {updateData.thankYouMessage = data.thankYouMessage;}

      const [template] = await db
        .update(pdfTemplates)
        .set(updateData)
        .where(eq(pdfTemplates.id, id))
        .returning();

      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/pdf-templates/:id
 * Delete PDF template (Admin only)
 */
pdfTemplatesRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    // Check exists
    const [existing] = await db
      .select({ id: pdfTemplates.id, isDefault: pdfTemplates.isDefault })
      .from(pdfTemplates)
      .where(eq(pdfTemplates.id, id));

    if (!existing) {
      throw new NotFoundError('PDF template not found');
    }

    if (existing.isDefault) {
      throw new BadRequestError('Cannot delete the default template. Set another template as default first.');
    }

    await db.delete(pdfTemplates).where(eq(pdfTemplates.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pdf-templates/:id/set-default
 * Set template as default (Admin only)
 */
pdfTemplatesRoutes.post('/:id/set-default', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    // Check exists
    const [existing] = await db
      .select({ id: pdfTemplates.id })
      .from(pdfTemplates)
      .where(eq(pdfTemplates.id, id));

    if (!existing) {
      throw new NotFoundError('PDF template not found');
    }

    // Unset all defaults
    await db
      .update(pdfTemplates)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(pdfTemplates.isDefault, true));

    // Set this as default
    const [template] = await db
      .update(pdfTemplates)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(pdfTemplates.id, id))
      .returning();

    sendSuccess(res, template);
  } catch (error) {
    next(error);
  }
});
