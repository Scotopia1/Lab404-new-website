import { Router } from 'express';
import { z } from 'zod';
import { getDb, quotations, quotationItems, customers, products, productVariants, settings, eq, sql, desc, and, or, like, gte, lte } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { pricingService } from '../services/pricing.service';
import { pdfService } from '../services/pdf.service';

export const quotationsRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const quotationItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  customPrice: z.number().positive().optional(), // Admin can override price
});

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

const updateQuotationSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  validDays: z.number().int().min(1).max(365).optional(),
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
        productId: string;
        name: string;
        description?: string;
        sku: string;
        quantity: number;
        unitPrice: number;
      }> = [];

      let subtotal = 0;

      for (const item of data.items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productId}`);
        }

        let unitPrice = Number(product.basePrice);
        let sku = product.sku;

        if (item.variantId) {
          const [variant] = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId));

          if (variant) {
            unitPrice = Number(variant.basePrice);
            sku = variant.sku;
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
          name: product.name,
          description: product.description || undefined,
          sku,
          quantity: item.quantity,
          unitPrice,
        });
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
          discountAmount: String(discountAmount),
          total: String(total),
          validUntil,
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
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        });
      }

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

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      // Update valid until if validDays provided
      if (data['validDays']) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (data['validDays'] as number));
        updateData['validUntil'] = validUntil;
        delete updateData['validDays'];
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

      sendSuccess(res, {
        ...quotation,
        subtotal: Number(quotation.subtotal),
        taxAmount: Number(quotation.taxAmount || 0),
        discountAmount: Number(quotation.discountAmount),
        total: Number(quotation.total),
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
 * GET /api/quotations/:id/pdf
 * Generate and download quotation PDF (Admin only)
 */
quotationsRoutes.get('/:id/pdf', requireAuth, requireAdmin, async (req, res, next) => {
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
    });

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

    // Update status to sent
    await db
      .update(quotations)
      .set({
        status: 'sent',
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, id));

    // TODO: Implement email sending via email service
    // For now, just mark as sent

    sendSuccess(res, {
      message: 'Quotation marked as sent',
      quotationNumber: quotation.quotationNumber,
      sentTo: quotation.customerEmail,
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
