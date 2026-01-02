import { Router } from 'express';
import { z } from 'zod';
import { getDb, categories, products, eq, isNull, sql } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';

export const categoriesRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const updateCategorySchema = createCategorySchema.partial();

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/categories
 * List all categories (hierarchical)
 */
categoriesRoutes.get('/', async (_req, res, next) => {
  try {
    const db = getDb();

    // Get all active categories
    const categoryList = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    // Build hierarchy
    const rootCategories = categoryList.filter(c => !c.parentId);
    const categoryMap = new Map(categoryList.map(c => [c.id, { ...c, children: [] as typeof categoryList }]));

    for (const category of categoryList) {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryMap.get(category.id)!);
        }
      }
    }

    const hierarchicalCategories = rootCategories.map(c => categoryMap.get(c.id)!);

    sendSuccess(res, hierarchicalCategories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/categories/:slug
 * Get category by slug with products
 */
categoriesRoutes.get('/:slug', async (req, res, next) => {
  try {
    const db = getDb();
    const slug = req.params['slug'] as string;

    const categoryResult = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));

    const category = categoryResult[0];

    if (!category || !category.isActive) {
      throw new NotFoundError('Category not found');
    }

    // Get product count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, category.id));

    const count = countResult[0]?.count ?? 0;

    // Get subcategories
    const subcategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, category.id));

    sendSuccess(res, {
      ...category,
      productCount: Number(count),
      children: subcategories,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * POST /api/categories
 * Create a new category (Admin only)
 */
categoriesRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createCategorySchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Generate slug if not provided
      let slug = data.slug || generateSlug(data.name);

      // Check if slug already exists
      const existingSlugResult = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, slug));

      const existingSlug = existingSlugResult[0];

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // Create category
      const categoryResult = await db
        .insert(categories)
        .values({
          ...data,
          slug,
        })
        .returning();

      const category = categoryResult[0];

      sendCreated(res, category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/categories/:id
 * Update a category (Admin only)
 */
categoriesRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateCategorySchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const existingResult = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));

      const existing = existingResult[0];

      if (!existing) {
        throw new NotFoundError('Category not found');
      }

      const categoryResult = await db
        .update(categories)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      const category = categoryResult[0];

      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Delete a category (Admin only)
 */
categoriesRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const existingResult = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id));

    const existing = existingResult[0];

    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    // Update products to remove category reference
    await db
      .update(products)
      .set({ categoryId: null })
      .where(eq(products.categoryId, id));

    // Update child categories to remove parent
    await db
      .update(categories)
      .set({ parentId: null })
      .where(eq(categories.parentId, id));

    await db.delete(categories).where(eq(categories.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
