import { Router } from 'express';
import { z } from 'zod';
import { getDb, products, categories, orders, customers, promoCodes, quotations, orderItems, quotationItems, eq, desc, and, gte, lte, sql } from '@lab404/database';
import { validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { exportService } from '../services/export.service';

export const exportRoutes = Router();

// Apply admin auth to all routes
exportRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json', 'jsonl']).optional().default('csv'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

// Helper to set export headers
function setExportHeaders(res: any, filename: string, contentType: string) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

// ===========================================
// Product Export
// ===========================================

/**
 * GET /api/export/products
 * Export all products - ALL fields
 */
exportRoutes.get('/products', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, status } = req.query;

    const conditions = [];
    if (status) {
      conditions.push(eq(products.status, status as 'draft' | 'active' | 'archived'));
    }

    const productList = await db
      .select({
        id: products.id,
        sku: products.sku,
        barcode: products.barcode,
        name: products.name,
        slug: products.slug,
        description: products.description,
        shortDescription: products.shortDescription,
        categoryId: products.categoryId,
        categoryName: categories.name,
        brand: products.brand,
        basePrice: products.basePrice,
        costPrice: products.costPrice,
        compareAtPrice: products.compareAtPrice,
        weight: products.weight,
        dimensions: products.dimensions,
        stockQuantity: products.stockQuantity,
        lowStockThreshold: products.lowStockThreshold,
        trackInventory: products.trackInventory,
        allowBackorder: products.allowBackorder,
        images: products.images,
        videos: products.videos,
        thumbnailUrl: products.thumbnailUrl,
        tags: products.tags,
        specifications: products.specifications,
        features: products.features,
        metaTitle: products.metaTitle,
        metaDescription: products.metaDescription,
        status: products.status,
        isFeatured: products.isFeatured,
        isDigital: products.isDigital,
        requiresShipping: products.requiresShipping,
        supplierId: products.supplierId,
        supplierSku: products.supplierSku,
        importedFrom: products.importedFrom,
        externalUrl: products.externalUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(products.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('products', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(productList as any[], exportService.getProductColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(productList));
    } else {
      res.send(exportService.toJSON(productList));
    }
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Order Export
// ===========================================

/**
 * GET /api/export/orders
 * Export orders - ALL fields
 */
exportRoutes.get('/orders', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, startDate, endDate, status } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }
    if (status) {
      conditions.push(eq(orders.status, status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'));
    }

    const orderList = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerEmail: customers.email,
        customerName: sql<string>`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        currency: orders.currency,
        subtotalSnapshot: orders.subtotalSnapshot,
        taxRateSnapshot: orders.taxRateSnapshot,
        taxAmountSnapshot: orders.taxAmountSnapshot,
        shippingAmountSnapshot: orders.shippingAmountSnapshot,
        discountAmountSnapshot: orders.discountAmountSnapshot,
        totalSnapshot: orders.totalSnapshot,
        promoCodeId: orders.promoCodeId,
        promoCodeSnapshot: orders.promoCodeSnapshot,
        shippingMethod: orders.shippingMethod,
        trackingNumber: orders.trackingNumber,
        confirmedAt: orders.confirmedAt,
        processingAt: orders.processingAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        customerNotes: orders.customerNotes,
        adminNotes: orders.adminNotes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('orders', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(orderList as any[], exportService.getOrderColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(orderList));
    } else {
      res.send(exportService.toJSON(orderList));
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/orders/:id/items
 * Export order items for a specific order
 */
exportRoutes.get('/orders/:id/items', async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const format = (req.query['format'] as string) || 'csv';

    // Get order number for context
    const [order] = await db.select({ orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, id));

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        orderNumber: sql<string>`${order?.orderNumber || ''}`,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        productNameSnapshot: orderItems.productNameSnapshot,
        skuSnapshot: orderItems.skuSnapshot,
        variantOptionsSnapshot: orderItems.variantOptionsSnapshot,
        quantity: orderItems.quantity,
        unitPriceSnapshot: orderItems.unitPriceSnapshot,
        lineTotal: sql<string>`CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity}`,
        createdAt: orderItems.createdAt,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename(`order-${order?.orderNumber || id}-items`, extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(items as any[], exportService.getOrderItemColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/order-items
 * Export ALL order items (bulk export)
 */
exportRoutes.get('/order-items', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, startDate, endDate } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        orderNumber: orders.orderNumber,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        productNameSnapshot: orderItems.productNameSnapshot,
        skuSnapshot: orderItems.skuSnapshot,
        variantOptionsSnapshot: orderItems.variantOptionsSnapshot,
        quantity: orderItems.quantity,
        unitPriceSnapshot: orderItems.unitPriceSnapshot,
        lineTotal: sql<string>`CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity}`,
        createdAt: orderItems.createdAt,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('order-items', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(items as any[], exportService.getOrderItemColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Customer Export
// ===========================================

/**
 * GET /api/export/customers
 * Export customers - ALL fields
 */
exportRoutes.get('/customers', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, startDate, endDate } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(customers.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(customers.createdAt, end));
    }

    const customerList = await db
      .select({
        id: customers.id,
        authUserId: customers.authUserId,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        defaultShippingAddress: customers.defaultShippingAddress,
        defaultBillingAddress: customers.defaultBillingAddress,
        isGuest: customers.isGuest,
        isActive: customers.isActive,
        acceptsMarketing: customers.acceptsMarketing,
        notes: customers.notes,
        tags: customers.tags,
        orderCount: customers.orderCount,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customers.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('customers', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(customerList as any[], exportService.getCustomerColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(customerList));
    } else {
      res.send(exportService.toJSON(customerList));
    }
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Promo Code Export
// ===========================================

/**
 * GET /api/export/promo-codes
 * Export promo codes - ALL fields
 */
exportRoutes.get('/promo-codes', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format } = req.query;

    const promoCodeList = await db
      .select()
      .from(promoCodes)
      .orderBy(desc(promoCodes.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('promo-codes', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(promoCodeList as any[], exportService.getPromoCodeColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(promoCodeList));
    } else {
      res.send(exportService.toJSON(promoCodeList));
    }
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Quotation Export
// ===========================================

/**
 * GET /api/export/quotations
 * Export quotations - ALL fields
 */
exportRoutes.get('/quotations', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, startDate, endDate, status } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(quotations.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(quotations.createdAt, end));
    }
    if (status) {
      conditions.push(eq(quotations.status, status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'));
    }

    const quotationList = await db
      .select()
      .from(quotations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(quotations.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('quotations', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(quotationList as any[], exportService.getQuotationColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(quotationList));
    } else {
      res.send(exportService.toJSON(quotationList));
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/quotation-items
 * Export ALL quotation items (bulk export)
 */
exportRoutes.get('/quotation-items', validateQuery(exportQuerySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { format, startDate, endDate } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(quotations.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(quotations.createdAt, end));
    }

    const items = await db
      .select({
        id: quotationItems.id,
        quotationId: quotationItems.quotationId,
        quotationNumber: quotations.quotationNumber,
        productId: quotationItems.productId,
        variantId: quotationItems.variantId,
        name: quotationItems.name,
        description: quotationItems.description,
        sku: quotationItems.sku,
        quantity: quotationItems.quantity,
        unitPrice: quotationItems.unitPrice,
        lineTotal: sql<string>`CAST(${quotationItems.unitPrice} AS DECIMAL) * ${quotationItems.quantity}`,
        createdAt: quotationItems.createdAt,
      })
      .from(quotationItems)
      .innerJoin(quotations, eq(quotationItems.quotationId, quotations.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(quotations.createdAt));

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('quotation-items', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(items as any[], exportService.getQuotationItemColumns());
      res.send(csv);
    } else if (format === 'jsonl') {
      res.send(exportService.toJSONL(items));
    } else {
      res.send(exportService.toJSON(items));
    }
  } catch (error) {
    next(error);
  }
});
