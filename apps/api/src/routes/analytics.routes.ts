import { Router } from 'express';
import { z } from 'zod';
import { getDb, orders, orderItems, customers, products, productVariants, sql, desc, eq, and, gte, lte } from '@lab404/database';
import { validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

export const analyticsRoutes = Router();

// Apply admin auth to all routes
analyticsRoutes.use(requireAuth, requireAdmin);

// ===========================================
// Validation Schemas
// ===========================================

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'all']).optional(),
});

// Helper to get date range
function getDateRange(query: { startDate?: string; endDate?: string; period?: string }) {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  if (query.period) {
    switch (query.period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = undefined;
        endDate = undefined;
        break;
    }
  } else {
    if (query.startDate) {
      startDate = new Date(query.startDate);
      startDate.setHours(0, 0, 0, 0);
    }
    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
}

// ===========================================
// Dashboard Overview
// ===========================================

/**
 * GET /api/analytics/dashboard
 * Get dashboard overview stats
 */
analyticsRoutes.get('/dashboard', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    // Build date conditions
    const orderConditions = [];
    if (startDate) {orderConditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {orderConditions.push(lte(orders.createdAt, endDate));}
    const orderWhere = orderConditions.length > 0 ? and(...orderConditions) : undefined;

    // Total revenue
    const [revenueResult] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          orderWhere,
          eq(orders.paymentStatus, 'paid')
        )
      );

    // Pending orders
    const [pendingResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          orderWhere,
          eq(orders.status, 'pending')
        )
      );

    // Total customers
    const customerConditions = [];
    if (startDate) {customerConditions.push(gte(customers.createdAt, startDate));}
    if (endDate) {customerConditions.push(lte(customers.createdAt, endDate));}
    const customerWhere = customerConditions.length > 0 ? and(...customerConditions) : undefined;

    const [customerResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers)
      .where(customerWhere);

    // Average order value
    const averageOrderValue = revenueResult?.orderCount && revenueResult.orderCount > 0
      ? Number(revenueResult.totalRevenue) / Number(revenueResult.orderCount)
      : 0;

    // Compare with previous period
    let previousPeriodData = null;
    if (startDate && endDate) {
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStart = new Date(startDate.getTime() - periodLength);
      const prevEnd = new Date(startDate.getTime() - 1);

      const [prevRevenue] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
          orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, prevStart),
            lte(orders.createdAt, prevEnd),
            eq(orders.paymentStatus, 'paid')
          )
        );

      const [prevCustomers] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customers)
        .where(
          and(
            gte(customers.createdAt, prevStart),
            lte(customers.createdAt, prevEnd)
          )
        );

      const currentRevenue = Number(revenueResult?.totalRevenue ?? 0);
      const prevRevenueNum = Number(prevRevenue?.totalRevenue ?? 0);

      previousPeriodData = {
        revenueChange: prevRevenueNum > 0
          ? ((currentRevenue - prevRevenueNum) / prevRevenueNum) * 100
          : currentRevenue > 0 ? 100 : 0,
        orderCountChange: Number(prevRevenue?.orderCount ?? 0) > 0
          ? ((Number(revenueResult?.orderCount ?? 0) - Number(prevRevenue?.orderCount ?? 0)) / Number(prevRevenue?.orderCount ?? 1)) * 100
          : Number(revenueResult?.orderCount ?? 0) > 0 ? 100 : 0,
        customerCountChange: Number(prevCustomers?.count ?? 0) > 0
          ? ((Number(customerResult?.count ?? 0) - Number(prevCustomers?.count ?? 0)) / Number(prevCustomers?.count ?? 1)) * 100
          : Number(customerResult?.count ?? 0) > 0 ? 100 : 0,
      };
    }

    sendSuccess(res, {
      totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
      orderCount: Number(revenueResult?.orderCount ?? 0),
      pendingOrders: Number(pendingResult?.count ?? 0),
      customerCount: Number(customerResult?.count ?? 0),
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      previousPeriodComparison: previousPeriodData,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Sales Analytics
// ===========================================

/**
 * GET /api/analytics/sales
 * Get sales data over time
 */
analyticsRoutes.get('/sales', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const groupBy = (req.query['groupBy'] as string) || 'day';

    let dateFormat: string;
    switch (groupBy) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const conditions = [eq(orders.paymentStatus, 'paid')];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}

    // Create the period expression as a reusable SQL fragment
    const periodExpr = sql`TO_CHAR(${orders.createdAt}, ${sql.raw(`'${dateFormat}'`)})`;

    const salesData = await db
      .select({
        period: sql<string>`${periodExpr}`,
        revenue: sql<number>`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
        averageOrderValue: sql<number>`AVG(CAST(${orders.totalSnapshot} AS DECIMAL))`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(periodExpr)
      .orderBy(periodExpr);

    sendSuccess(res, salesData.map(row => ({
      period: row.period,
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
      averageOrderValue: Math.round(Number(row.averageOrderValue) * 100) / 100,
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/sales/by-status
 * Get sales breakdown by order status
 */
analyticsRoutes.get('/sales/by-status', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    const conditions = [];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const statusData = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    sendSuccess(res, statusData.map(row => ({
      status: row.status,
      count: Number(row.count),
      totalValue: Number(row.totalValue) || 0,
    })));
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Product Analytics
// ===========================================

/**
 * GET /api/analytics/products/top-selling
 * Get top selling products
 */
analyticsRoutes.get('/products/top-selling', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const limit = parseInt(req.query['limit'] as string) || 10;

    const conditions = [];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}

    // Only count delivered/completed orders
    conditions.push(eq(orders.paymentStatus, 'paid'));

    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productNameSnapshot,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(CAST(${orderItems.unitPriceSnapshot} AS DECIMAL) * ${orderItems.quantity})`,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...conditions))
      .groupBy(orderItems.productId, orderItems.productNameSnapshot)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);

    sendSuccess(res, topProducts.map(row => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
      orderCount: Number(row.orderCount),
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/products/low-stock
 * Get products with low stock
 */
analyticsRoutes.get('/products/low-stock', async (req, res, next) => {
  try {
    const db = getDb();
    const threshold = parseInt(req.query['threshold'] as string) || 10;

    // Products with low stock
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stockQuantity: products.stockQuantity,
        status: products.status,
      })
      .from(products)
      .where(
        and(
          eq(products.status, 'active'),
          lte(products.stockQuantity, threshold)
        )
      )
      .orderBy(products.stockQuantity)
      .limit(50);

    // Variants with low stock
    const lowStockVariants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        productName: products.name,
        sku: productVariants.sku,
        options: productVariants.options,
        stockQuantity: productVariants.stockQuantity,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(productVariants.isActive, true),
          lte(productVariants.stockQuantity, threshold)
        )
      )
      .orderBy(productVariants.stockQuantity)
      .limit(50);

    sendSuccess(res, {
      products: lowStockProducts,
      variants: lowStockVariants,
      threshold,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Customer Analytics
// ===========================================

/**
 * GET /api/analytics/customers/overview
 * Get customer analytics overview
 */
analyticsRoutes.get('/customers/overview', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    const conditions = [];
    if (startDate) {conditions.push(gte(customers.createdAt, startDate));}
    if (endDate) {conditions.push(lte(customers.createdAt, endDate));}
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total customers
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers)
      .where(whereClause);

    // Guest vs registered
    const [guestResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers)
      .where(
        and(
          whereClause,
          eq(customers.isGuest, true)
        )
      );

    // Customers with orders
    const [withOrdersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers)
      .where(
        and(
          whereClause,
          sql`${customers.orderCount} > 0`
        )
      );

    // Top customers by order count
    const topCustomers = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        orderCount: customers.orderCount,
      })
      .from(customers)
      .where(sql`${customers.orderCount} > 0`)
      .orderBy(desc(customers.orderCount))
      .limit(10);

    sendSuccess(res, {
      totalCustomers: Number(totalResult?.count ?? 0),
      guestCustomers: Number(guestResult?.count ?? 0),
      registeredCustomers: Number(totalResult?.count ?? 0) - Number(guestResult?.count ?? 0),
      customersWithOrders: Number(withOrdersResult?.count ?? 0),
      topCustomers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/customers/new
 * Get new customer registrations over time
 */
analyticsRoutes.get('/customers/new', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);
    const groupBy = (req.query['groupBy'] as string) || 'day';

    let dateFormat: string;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const conditions = [];
    if (startDate) {conditions.push(gte(customers.createdAt, startDate));}
    if (endDate) {conditions.push(lte(customers.createdAt, endDate));}
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const customerData = await db
      .select({
        period: sql<string>`TO_CHAR(${customers.createdAt}, ${dateFormat})`,
        total: sql<number>`COUNT(*)`,
        guests: sql<number>`COUNT(*) FILTER (WHERE ${customers.isGuest} = true)`,
        registered: sql<number>`COUNT(*) FILTER (WHERE ${customers.isGuest} = false)`,
      })
      .from(customers)
      .where(whereClause)
      .groupBy(sql`TO_CHAR(${customers.createdAt}, ${dateFormat})`)
      .orderBy(sql`TO_CHAR(${customers.createdAt}, ${dateFormat})`);

    sendSuccess(res, customerData.map(row => ({
      period: row.period,
      total: Number(row.total),
      guests: Number(row.guests),
      registered: Number(row.registered),
    })));
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Revenue Analytics
// ===========================================

/**
 * GET /api/analytics/revenue/breakdown
 * Get revenue breakdown
 */
analyticsRoutes.get('/revenue/breakdown', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    const conditions = [eq(orders.paymentStatus, 'paid')];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}

    const [breakdown] = await db
      .select({
        subtotal: sql<number>`SUM(CAST(${orders.subtotalSnapshot} AS DECIMAL))`,
        taxAmount: sql<number>`SUM(CAST(${orders.taxAmountSnapshot} AS DECIMAL))`,
        shippingAmount: sql<number>`SUM(CAST(${orders.shippingAmountSnapshot} AS DECIMAL))`,
        discountAmount: sql<number>`SUM(CAST(${orders.discountAmountSnapshot} AS DECIMAL))`,
        total: sql<number>`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...conditions));

    sendSuccess(res, {
      subtotal: Number(breakdown?.subtotal) || 0,
      taxAmount: Number(breakdown?.taxAmount) || 0,
      shippingAmount: Number(breakdown?.shippingAmount) || 0,
      discountAmount: Number(breakdown?.discountAmount) || 0,
      total: Number(breakdown?.total) || 0,
      orderCount: Number(breakdown?.orderCount) || 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/revenue/by-payment-method
 * Get revenue by payment method
 */
analyticsRoutes.get('/revenue/by-payment-method', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    const conditions = [eq(orders.paymentStatus, 'paid')];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}

    const byPaymentMethod = await db
      .select({
        paymentMethod: orders.paymentMethod,
        revenue: sql<number>`SUM(CAST(${orders.totalSnapshot} AS DECIMAL))`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...conditions))
      .groupBy(orders.paymentMethod);

    sendSuccess(res, byPaymentMethod.map(row => ({
      paymentMethod: row.paymentMethod || 'unknown',
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
    })));
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Recent Orders
// ===========================================

/**
 * GET /api/analytics/orders/recent
 * Get most recent orders for dashboard display
 */
analyticsRoutes.get('/orders/recent', async (req, res, next) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query['limit'] as string) || 10;

    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        customerEmail: customers.email,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        total: orders.totalSnapshot,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    sendSuccess(res, recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customerFirstName && order.customerLastName
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerEmail || 'Guest',
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
    })));
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Export Analytics Data
// ===========================================

/**
 * GET /api/analytics/export
 * Export analytics data as JSON
 */
analyticsRoutes.get('/export', validateQuery(dateRangeSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const { startDate, endDate } = getDateRange(req.query);

    // Gather all analytics data
    const conditions = [];
    if (startDate) {conditions.push(gte(orders.createdAt, startDate));}
    if (endDate) {conditions.push(lte(orders.createdAt, endDate));}

    // Get all orders in range
    const orderData = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.totalSnapshot,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    // Get customer data
    const customerConditions = [];
    if (startDate) {customerConditions.push(gte(customers.createdAt, startDate));}
    if (endDate) {customerConditions.push(lte(customers.createdAt, endDate));}

    const customerData = await db
      .select({
        id: customers.id,
        email: customers.email,
        isGuest: customers.isGuest,
        orderCount: customers.orderCount,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(customerConditions.length > 0 ? and(...customerConditions) : undefined);

    const exportData = {
      exportedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      summary: {
        totalOrders: orderData.length,
        totalCustomers: customerData.length,
        totalRevenue: orderData
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + Number(o.total), 0),
      },
      orders: orderData.map(o => ({
        ...o,
        total: Number(o.total),
      })),
      customers: customerData,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.json"`
    );

    res.json(exportData);
  } catch (error) {
    next(error);
  }
});
