import { Router } from 'express';
import { z } from 'zod';
import { getDb, products, categories, eq, ilike, and, or, gte, lte, sql, desc, asc } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generateSlug, generateSku } from '../utils/helpers';

export const productsRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const productFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'basePrice', 'createdAt', 'stockQuantity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createProductSchema = z.object({
  // Basic info
  sku: z.string().min(1).max(100).optional(),
  barcode: z.string().max(100).optional(),
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  brand: z.string().max(255).optional(),

  // Pricing
  basePrice: z.number().positive().max(999999.99),
  costPrice: z.number().positive().max(999999.99).optional().nullable(),
  compareAtPrice: z.number().positive().max(999999.99).optional().nullable(),

  // Physical attributes
  weight: z.number().positive().optional().nullable(),
  dimensions: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    depth: z.number().positive().optional(),
  }).optional().nullable(),

  // Inventory
  stockQuantity: z.number().int().min(0).optional().default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  trackInventory: z.boolean().optional().default(true),
  allowBackorder: z.boolean().optional().default(false),

  // Media
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).optional().default([]),
  videos: z.array(z.object({
    url: z.string().url(),
    title: z.string().optional(),
  })).optional().default([]),
  thumbnailUrl: z.string().url().optional().nullable(),

  // Organization & categorization
  tags: z.array(z.string()).max(20).optional().default([]),
  specifications: z.record(z.string()).optional().default({}),
  features: z.array(z.string()).max(20).optional().default([]),

  // SEO
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),

  // Status & flags
  status: z.enum(['draft', 'active', 'archived']).optional().default('draft'),
  isFeatured: z.boolean().optional().default(false),
  isDigital: z.boolean().optional().default(false),
  requiresShipping: z.boolean().optional().default(true),

  // Supplier
  supplierId: z.string().max(255).optional(),
  supplierSku: z.string().max(255).optional(),

  // Import
  importedFrom: z.string().max(255).optional(),
  externalUrl: z.string().url().max(500).optional(),
});

const updateProductSchema = createProductSchema.partial();

// ===========================================
// Public Routes
// ===========================================

/**
 * GET /api/products
 * List products with pagination and filters
 */
productsRoutes.get('/', validateQuery(productFiltersSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
    const filters = req.query;

    // Build where conditions
    const conditions = [];

    // Only show active products for public
    conditions.push(eq(products.status, 'active'));

    const search = filters['search'] as string | undefined;
    const categoryId = filters['categoryId'] as string | undefined;
    const minPrice = filters['minPrice'] as string | undefined;
    const maxPrice = filters['maxPrice'] as string | undefined;
    const inStock = filters['inStock'] as string | undefined;
    const isFeatured = filters['isFeatured'] as string | undefined;
    const sortBy = (filters['sortBy'] as string) || 'createdAt';
    const sortOrder = (filters['sortOrder'] as string) || 'desc';

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (minPrice) {
      conditions.push(gte(products.basePrice, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(products.basePrice, maxPrice));
    }

    if (inStock === 'true') {
      conditions.push(
        or(
          sql`${products.stockQuantity} > 0`,
          eq(products.allowBackorder, true)
        )
      );
    }

    if (isFeatured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(...conditions));
    const count = countResult[0]?.count ?? 0;

    const productList = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        slug: products.slug,
        thumbnailUrl: products.thumbnailUrl,
        images: products.images,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        status: products.status,
        isFeatured: products.isFeatured,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(and(...conditions))
      .orderBy(sortOrder === 'desc' ? desc(products.createdAt) : asc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Add computed inStock field and ensure images is an array
    const productsWithStock = productList.map(p => ({
      ...p,
      basePrice: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
      images: p.images || [],
      inStock: p.stockQuantity > 0,
    }));

    sendSuccess(res, productsWithStock, 200, createPaginationMeta(page, limit, Number(count)));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/featured
 * Get featured products
 */
productsRoutes.get('/featured', async (req, res, next) => {
  try {
    const db = getDb();
    const limit = Math.min(20, parseInt(req.query['limit'] as string || '8', 10));

    const productList = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        slug: products.slug,
        thumbnailUrl: products.thumbnailUrl,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        stockQuantity: products.stockQuantity,
      })
      .from(products)
      .where(and(eq(products.status, 'active'), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);

    const productsWithStock = productList.map(p => ({
      ...p,
      basePrice: Number(p.basePrice),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
      inStock: p.stockQuantity > 0,
    }));

    sendSuccess(res, productsWithStock);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:slug
 * Get product by slug
 */
productsRoutes.get('/:slug', async (req, res, next) => {
  try {
    const db = getDb();
    const slug = req.params['slug'] as string;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug));

    if (!product || product.status !== 'active') {
      throw new NotFoundError('Product not found');
    }

    // Get category
    let category;
    if (product.categoryId) {
      [category] = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .where(eq(categories.id, product.categoryId));
    }

    sendSuccess(res, {
      ...product,
      basePrice: Number(product.basePrice),
      costPrice: product.costPrice ? Number(product.costPrice) : undefined,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
      inStock: product.stockQuantity > 0 || product.allowBackorder,
      category,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
productsRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createProductSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Generate SKU if not provided
      const sku = data.sku || generateSku();

      // Check if SKU already exists
      const [existingSku] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, sku));

      if (existingSku) {
        throw new ConflictError('SKU already exists');
      }

      // Generate slug if not provided
      let slug = data.slug || generateSlug(data.name);

      // Check if slug already exists
      const [existingSlug] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug));

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // Create product
      const insertResult = await db
        .insert(products)
        .values({
          ...data,
          sku,
          slug,
          basePrice: String(data.basePrice),
          costPrice: data.costPrice ? String(data.costPrice) : null,
          compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
          weight: data.weight ? String(data.weight) : null,
          categoryId: data.categoryId || null,
          thumbnailUrl: data.thumbnailUrl || null,
        })
        .returning();

      const product = insertResult[0];
      if (!product) {
        throw new Error('Failed to create product');
      }

      sendCreated(res, {
        ...product,
        basePrice: Number(product.basePrice),
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/products/:id
 * Update a product (Admin only)
 */
productsRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateProductSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      // Check if product exists
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id));

      if (!existing) {
        throw new NotFoundError('Product not found');
      }

      // Update product
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      // Convert decimal fields to strings for database
      if (data.basePrice !== undefined) {
        updateData['basePrice'] = String(data.basePrice);
      }
      if (data.costPrice !== undefined) {
        updateData['costPrice'] = data.costPrice ? String(data.costPrice) : null;
      }
      if (data.compareAtPrice !== undefined) {
        updateData['compareAtPrice'] = data.compareAtPrice ? String(data.compareAtPrice) : null;
      }
      if (data.weight !== undefined) {
        updateData['weight'] = data.weight ? String(data.weight) : null;
      }
      // Handle nullable fields
      if (data.categoryId !== undefined) {
        updateData['categoryId'] = data.categoryId || null;
      }
      if (data.thumbnailUrl !== undefined) {
        updateData['thumbnailUrl'] = data.thumbnailUrl || null;
      }

      const updateResult = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      const product = updateResult[0];
      if (!product) {
        throw new NotFoundError('Product not found');
      }

      sendSuccess(res, {
        ...product,
        basePrice: Number(product.basePrice),
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/products/:id
 * Delete a product (Admin only)
 */
productsRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    await db.delete(products).where(eq(products.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});
