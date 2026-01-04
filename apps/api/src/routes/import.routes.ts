import { Router } from 'express';
import { z } from 'zod';
import { getDb, products, categories, customers, productImportJobs, eq } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { importService } from '../services/import.service';
import { generateSlug } from '../utils/helpers';

export const importRoutes = Router();

// Apply admin auth to all routes
importRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const csvImportSchema = z.object({
  csvContent: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
  updateExisting: z.boolean().optional().default(false),
});

const urlImportSchema = z.object({
  url: z.string().url(),
  source: z.enum(['amazon', 'aliexpress', 'ebay', 'other']).optional().default('other'),
});

// ===========================================
// Template Downloads
// ===========================================

/**
 * GET /api/import/templates/products
 * Download product import template
 */
importRoutes.get('/templates/products', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.send(importService.getProductTemplate());
});

/**
 * GET /api/import/templates/customers
 * Download customer import template
 */
importRoutes.get('/templates/customers', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="customer-import-template.csv"');
  res.send(importService.getCustomerTemplate());
});

// ===========================================
// Product Import
// ===========================================

/**
 * POST /api/import/products
 * Import products from CSV
 */
importRoutes.post(
  '/products',
  validateBody(csvImportSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { csvContent, dryRun, updateExisting } = req.body;

      // Parse CSV
      const rawData = importService.parseCSV(csvContent);

      if (rawData.length === 0) {
        throw new BadRequestError('CSV file is empty or invalid');
      }

      // Validate and map data
      const result = importService.mapAndValidate(
        rawData,
        importService.getProductMappings(),
        importService.getProductSchema()
      );

      // If dry run, just return validation results
      if (dryRun) {
        return sendSuccess(res, {
          dryRun: true,
          ...result,
          data: result.data.slice(0, 5), // Only return first 5 for preview
        });
      }

      // Import products
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const productData of result.data) {
        const data = productData as z.infer<ReturnType<typeof importService.getProductSchema>>;

        // Check if product with same SKU exists
        const [existingProduct] = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.sku, data.sku));

        if (existingProduct) {
          if (updateExisting) {
            // Update existing product with ALL fields
            await db
              .update(products)
              .set({
                name: data.name,
                barcode: data.barcode,
                description: data.description,
                shortDescription: data.shortDescription,
                basePrice: String(data.basePrice),
                costPrice: data.costPrice ? String(data.costPrice) : undefined,
                compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : undefined,
                stockQuantity: data.stockQuantity,
                lowStockThreshold: data.lowStockThreshold,
                trackInventory: data.trackInventory,
                allowBackorder: data.allowBackorder,
                weight: data.weight ? String(data.weight) : undefined,
                dimensions: data.dimensions,
                brand: data.brand,
                status: data.status,
                isFeatured: data.isFeatured,
                isDigital: data.isDigital,
                requiresShipping: data.requiresShipping,
                thumbnailUrl: data.thumbnailUrl,
                images: data.images,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                tags: data.tags,
                features: data.features,
                specifications: data.specifications,
                supplierId: data.supplierId,
                supplierSku: data.supplierSku,
                updatedAt: new Date(),
              })
              .where(eq(products.id, existingProduct.id));
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        // Get category ID if category name provided
        let categoryId: string | undefined;
        if (data.categoryName) {
          const [category] = await db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.name, data.categoryName));

          if (category) {
            categoryId = category.id;
          }
        }

        // Generate slug
        const slug = generateSlug(data.name);

        // Create product with ALL fields
        await db.insert(products).values({
          name: data.name,
          slug: `${slug}-${Date.now()}`, // Ensure unique slug
          sku: data.sku,
          barcode: data.barcode,
          description: data.description,
          shortDescription: data.shortDescription,
          basePrice: String(data.basePrice),
          costPrice: data.costPrice ? String(data.costPrice) : undefined,
          compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : undefined,
          stockQuantity: data.stockQuantity || 0,
          lowStockThreshold: data.lowStockThreshold || 5,
          trackInventory: data.trackInventory ?? true,
          allowBackorder: data.allowBackorder || false,
          weight: data.weight ? String(data.weight) : undefined,
          dimensions: data.dimensions,
          categoryId,
          brand: data.brand,
          status: data.status || 'draft',
          isFeatured: data.isFeatured || false,
          isDigital: data.isDigital || false,
          requiresShipping: data.requiresShipping ?? true,
          thumbnailUrl: data.thumbnailUrl,
          images: data.images || [],
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          tags: data.tags || [],
          features: data.features || [],
          specifications: data.specifications || {},
          supplierId: data.supplierId,
          supplierSku: data.supplierSku,
        });

        importedCount++;
      }

      sendSuccess(res, {
        success: true,
        totalRows: result.totalRows,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: result.errors,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Customer Import
// ===========================================

/**
 * POST /api/import/customers
 * Import customers from CSV
 */
importRoutes.post(
  '/customers',
  validateBody(csvImportSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { csvContent, dryRun, updateExisting } = req.body;

      // Parse CSV
      const rawData = importService.parseCSV(csvContent);

      if (rawData.length === 0) {
        throw new BadRequestError('CSV file is empty or invalid');
      }

      // Validate and map data
      const result = importService.mapAndValidate(
        rawData,
        importService.getCustomerMappings(),
        importService.getCustomerSchema()
      );

      // If dry run, just return validation results
      if (dryRun) {
        return sendSuccess(res, {
          dryRun: true,
          ...result,
          data: result.data.slice(0, 5),
        });
      }

      // Import customers
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const customerData of result.data) {
        const data = customerData as z.infer<ReturnType<typeof importService.getCustomerSchema>>;

        // Check if customer with same email exists
        const [existingCustomer] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.email, data.email.toLowerCase()));

        if (existingCustomer) {
          if (updateExisting) {
            // Build address JSON from flat fields
            const shippingAddress = importService.buildAddressFromFlatFields(data as Record<string, unknown>, 'shipping');
            const billingAddress = importService.buildAddressFromFlatFields(data as Record<string, unknown>, 'billing');

            await db
              .update(customers)
              .set({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                isActive: data.isActive,
                acceptsMarketing: data.acceptsMarketing,
                notes: data.notes,
                tags: data.tags,
                defaultShippingAddress: shippingAddress,
                defaultBillingAddress: billingAddress,
                updatedAt: new Date(),
              })
              .where(eq(customers.id, existingCustomer.id));
            updatedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        // Build address JSON from flat fields
        const shippingAddress = importService.buildAddressFromFlatFields(data as Record<string, unknown>, 'shipping');
        const billingAddress = importService.buildAddressFromFlatFields(data as Record<string, unknown>, 'billing');

        // Create customer with ALL fields
        await db.insert(customers).values({
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          isActive: data.isActive ?? true,
          isGuest: false,
          acceptsMarketing: data.acceptsMarketing || false,
          notes: data.notes,
          tags: data.tags || [],
          defaultShippingAddress: shippingAddress,
          defaultBillingAddress: billingAddress,
        });

        importedCount++;
      }

      sendSuccess(res, {
        success: true,
        totalRows: result.totalRows,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: result.errors,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// URL Import (Web Scraping)
// ===========================================

/**
 * POST /api/import/from-url
 * Create import job from URL (Amazon, AliExpress, eBay)
 */
importRoutes.post(
  '/from-url',
  validateBody(urlImportSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { url, source } = req.body;

      // Validate URL domain matches source
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      let detectedSource = source;
      if (hostname.includes('amazon')) {
        detectedSource = 'amazon';
      } else if (hostname.includes('aliexpress')) {
        detectedSource = 'aliexpress';
      } else if (hostname.includes('ebay')) {
        detectedSource = 'ebay';
      }

      // Create import job
      const jobResult = await db
        .insert(productImportJobs)
        .values({
          source: detectedSource as 'amazon' | 'aliexpress' | 'ebay',
          sourceUrl: url,
          status: 'pending',
        })
        .returning();
      const job = jobResult[0];

      if (!job) {
        throw new BadRequestError('Failed to create import job');
      }

      // TODO: Queue job for background processing
      // For now, just return the job ID

      sendCreated(res, {
        jobId: job.id,
        status: job.status,
        source: detectedSource,
        url,
        message: 'Import job created. Product data will be extracted in the background.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/import/jobs
 * List import jobs
 */
importRoutes.get('/jobs', async (req, res, next) => {
  try {
    const db = getDb();

    const jobs = await db
      .select()
      .from(productImportJobs)
      .orderBy(productImportJobs.createdAt);

    sendSuccess(res, jobs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/import/jobs/:id
 * Get import job status
 */
importRoutes.get('/jobs/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const [job] = await db
      .select()
      .from(productImportJobs)
      .where(eq(productImportJobs.id, id));

    if (!job) {
      throw new NotFoundError('Import job not found');
    }

    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/import/jobs/:id/retry
 * Retry failed import job
 */
importRoutes.post('/jobs/:id/retry', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const [job] = await db
      .select()
      .from(productImportJobs)
      .where(eq(productImportJobs.id, id));

    if (!job) {
      throw new NotFoundError('Import job not found');
    }

    if (job.status !== 'failed') {
      throw new BadRequestError('Only failed jobs can be retried');
    }

    // Reset job status
    await db
      .update(productImportJobs)
      .set({
        status: 'pending',
        errorMessage: null,
      })
      .where(eq(productImportJobs.id, id));

    // TODO: Re-queue job for processing

    sendSuccess(res, { message: 'Job queued for retry' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/import/jobs/:id
 * Delete import job
 */
importRoutes.delete('/jobs/:id', async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const [job] = await db
      .select({ id: productImportJobs.id })
      .from(productImportJobs)
      .where(eq(productImportJobs.id, id));

    if (!job) {
      throw new NotFoundError('Import job not found');
    }

    await db.delete(productImportJobs).where(eq(productImportJobs.id, id));

    sendSuccess(res, { message: 'Import job deleted' });
  } catch (error) {
    next(error);
  }
});
