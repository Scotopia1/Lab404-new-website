import { Router } from 'express';
import { z } from 'zod';
import { getDb, products, categories, orders, customers, promoCodes, quotations, orderItems, eq, desc, and, gte, lte, sql } from '@lab404/database';
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
 * Export all products
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
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        description: products.description,
        basePrice: products.basePrice,
        stockQuantity: products.stockQuantity,
        categoryId: products.categoryId,
        categoryName: categories.name,
        brand: products.brand,
        status: products.status,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
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
 * Export orders
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
        subtotalSnapshot: orders.subtotalSnapshot,
        taxAmountSnapshot: orders.taxAmountSnapshot,
        shippingAmountSnapshot: orders.shippingAmountSnapshot,
        discountAmountSnapshot: orders.discountAmountSnapshot,
        totalSnapshot: orders.totalSnapshot,
        currency: orders.currency,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
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

    const items = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productNameSnapshot,
        sku: orderItems.skuSnapshot,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPriceSnapshot,
        lineTotal: sql<string>`CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity}`,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const columns = [
      { key: 'productName', header: 'Product Name' },
      { key: 'sku', header: 'SKU' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'unitPrice', header: 'Unit Price', formatter: (v: unknown) => Number(v).toFixed(2) },
      { key: 'lineTotal', header: 'Line Total', formatter: (v: unknown) => Number(v).toFixed(2) },
    ];

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename(`order-${id}-items`, extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(items as any[], columns as any);
      res.send(csv);
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
 * Export customers
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
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        isGuest: customers.isGuest,
        isActive: customers.isActive,
        orderCount: customers.orderCount,
        createdAt: customers.createdAt,
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
 * Export promo codes
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
 * Export quotations
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

    const columns = [
      { key: 'quotationNumber', header: 'Quotation Number' },
      { key: 'customerName', header: 'Customer Name' },
      { key: 'customerEmail', header: 'Customer Email' },
      { key: 'status', header: 'Status' },
      { key: 'subtotal', header: 'Subtotal', formatter: (v: unknown) => Number(v).toFixed(2) },
      { key: 'total', header: 'Total', formatter: (v: unknown) => Number(v).toFixed(2) },
      { key: 'validUntil', header: 'Valid Until', formatter: (v: unknown) => v ? new Date(v as string).toISOString() : '' },
      { key: 'createdAt', header: 'Created At', formatter: (v: unknown) => new Date(v as string).toISOString() },
    ];

    const { contentType, extension } = exportService.getContentType(format as 'csv' | 'json' | 'jsonl');
    const filename = exportService.getFilename('quotations', extension);

    setExportHeaders(res, filename, contentType);

    if (format === 'csv') {
      const csv = exportService.toCSV(quotationList as any[], columns as any);
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
