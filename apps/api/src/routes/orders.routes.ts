import { Router } from 'express';
import { z } from 'zod';
import { getDb, orders, orderItems, customers, carts, cartItems, cartPromoCodes, products, productVariants, promoCodes, eq, sql, desc, and } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendCreated, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { pricingService } from '../services/pricing.service';
import { generateOrderNumber } from '../utils/helpers';

export const ordersRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(255).optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(1).max(100),
  phone: z.string().max(50).optional(),
});

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().optional().default(true),
  customerEmail: z.string().email(),
  customerNotes: z.string().max(1000).optional(),
  paymentMethod: z.enum(['cod']).default('cod'),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  trackingNumber: z.string().max(255).optional(),
  shippingMethod: z.string().max(100).optional(),
  adminNotes: z.string().max(1000).optional(),
});

const orderFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
});

// ===========================================
// Public Routes
// ===========================================

/**
 * POST /api/orders
 * Create a new order (checkout)
 */
ordersRoutes.post(
  '/',
  strictLimiter,
  optionalAuth,
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const userId = req.user?.customerId;
      const sessionId = req.sessionId || req.headers['x-session-id'] as string;
      const data = req.body;

      if (!userId && !sessionId) {
        throw new BadRequestError('No cart found');
      }

      // Get cart
      let cart;
      if (userId) {
        [cart] = await db.select().from(carts).where(eq(carts.customerId, userId));
      } else if (sessionId) {
        [cart] = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
      }

      if (!cart) {
        throw new BadRequestError('Cart not found');
      }

      // Get cart items
      const items = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));

      if (items.length === 0) {
        throw new BadRequestError('Cart is empty');
      }

      // Get promo code if applied
      const [promoCode] = await db
        .select()
        .from(cartPromoCodes)
        .where(eq(cartPromoCodes.cartId, cart.id));

      // Calculate totals using pricing service
      const cartInput = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      }));

      const totals = await pricingService.calculateOrderTotals(
        cartInput,
        promoCode?.code
      );

      // Get or create customer
      let customer;
      if (userId) {
        [customer] = await db.select().from(customers).where(eq(customers.id, userId));
      } else {
        // Create guest customer
        [customer] = await db
          .insert(customers)
          .values({
            email: data.customerEmail.toLowerCase(),
            firstName: data.shippingAddress.firstName,
            lastName: data.shippingAddress.lastName,
            phone: data.shippingAddress.phone,
            isGuest: true,
          })
          .returning();
      }

      // Generate order number
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders);
      const count = countResult[0]?.count ?? 0;
      const orderNumber = generateOrderNumber(Number(count) + 1);

      // Determine billing address
      const billingAddress = data.sameAsShipping
        ? data.shippingAddress
        : data.billingAddress || data.shippingAddress;

      if (!customer) {
        throw new BadRequestError('Failed to create or find customer');
      }

      // Create order
      const orderResult = await db
        .insert(orders)
        .values({
          orderNumber,
          customerId: customer.id,
          status: 'pending',
          paymentStatus: 'pending',
          shippingAddress: data.shippingAddress,
          billingAddress,
          currency: 'USD',
          subtotalSnapshot: String(totals.subtotal),
          taxRateSnapshot: String(totals.taxRate),
          taxAmountSnapshot: String(totals.taxAmount),
          shippingAmountSnapshot: String(totals.shippingAmount),
          discountAmountSnapshot: String(totals.discountAmount),
          totalSnapshot: String(totals.total),
          promoCodeId: totals.promoCodeId,
          promoCodeSnapshot: totals.promoCodeSnapshot,
          paymentMethod: data.paymentMethod,
          customerNotes: data.customerNotes,
        })
        .returning();
      const order = orderResult[0];

      if (!order) {
        throw new BadRequestError('Failed to create order');
      }

      // Create order items with product snapshots
      for (const item of items) {
        const productResult = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        const product = productResult[0];

        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productId}`);
        }

        let variant;
        if (item.variantId) {
          const variantResult = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId));
          variant = variantResult[0];
        }

        const unitPrice = variant ? Number(variant.basePrice) : Number(product.basePrice);

        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: product.name,
          skuSnapshot: variant?.sku || product.sku,
          variantOptionsSnapshot: variant?.options,
          quantity: item.quantity,
          unitPriceSnapshot: String(unitPrice),
        });
      }

      // Update promo code usage
      if (totals.promoCodeId) {
        await db
          .update(promoCodes)
          .set({ usageCount: sql`${promoCodes.usageCount} + 1` })
          .where(eq(promoCodes.id, totals.promoCodeId));
      }

      // Update customer order count
      await db
        .update(customers)
        .set({ orderCount: sql`${customers.orderCount} + 1` })
        .where(eq(customers.id, customer.id));

      // Clear cart
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db.delete(cartPromoCodes).where(eq(cartPromoCodes.cartId, cart.id));

      sendCreated(res, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: totals.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orders/track/:orderNumber
 * Public order tracking
 */
ordersRoutes.get('/track/:orderNumber', async (req, res, next) => {
  try {
    const db = getDb();
    const orderNumber = req.params['orderNumber'] as string;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Build timeline
    const timeline = [
      { status: 'pending', timestamp: order.createdAt.toISOString(), description: 'Order placed' },
    ];

    if (order.status !== 'pending' && order.status !== 'cancelled') {
      timeline.push({ status: 'confirmed', timestamp: order.createdAt.toISOString(), description: 'Order confirmed' });
    }

    if (['processing', 'shipped', 'delivered'].includes(order.status)) {
      timeline.push({ status: 'processing', timestamp: order.updatedAt.toISOString(), description: 'Order is being processed' });
    }

    if (['shipped', 'delivered'].includes(order.status) && order.shippedAt) {
      timeline.push({ status: 'shipped', timestamp: order.shippedAt.toISOString(), description: 'Order shipped' });
    }

    if (order.status === 'delivered' && order.deliveredAt) {
      timeline.push({ status: 'delivered', timestamp: order.deliveredAt.toISOString(), description: 'Order delivered' });
    }

    sendSuccess(res, {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      timeline,
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Customer Routes
// ===========================================

/**
 * GET /api/orders
 * Get customer's orders
 */
ordersRoutes.get('/', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = req.user?.customerId;

    if (!customerId) {
      throw new ForbiddenError('Customer not found');
    }

    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, customerId));
    const count = countResult[0]?.count ?? 0;

    const orderList = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalSnapshot: orders.totalSnapshot,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const ordersWithTotals = orderList.map(o => ({
      ...o,
      totalSnapshot: Number(o.totalSnapshot),
    }));

    sendSuccess(res, ordersWithTotals, 200, createPaginationMeta(page, limit, Number(count)));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
ordersRoutes.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const customerId = req.user?.customerId;
    const isAdmin = req.user?.role === 'admin';

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check ownership (unless admin)
    if (!isAdmin && order.customerId !== customerId) {
      throw new ForbiddenError('Access denied');
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    sendSuccess(res, {
      ...order,
      subtotalSnapshot: Number(order.subtotalSnapshot),
      taxRateSnapshot: Number(order.taxRateSnapshot),
      taxAmountSnapshot: Number(order.taxAmountSnapshot),
      shippingAmountSnapshot: Number(order.shippingAmountSnapshot),
      discountAmountSnapshot: Number(order.discountAmountSnapshot),
      totalSnapshot: Number(order.totalSnapshot),
      items: items.map(item => ({
        ...item,
        unitPriceSnapshot: Number(item.unitPriceSnapshot),
        lineTotalSnapshot: Number(item.unitPriceSnapshot) * item.quantity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/orders/admin/all
 * Get all orders (Admin only)
 */
ordersRoutes.get(
  '/admin/all',
  requireAuth,
  requireAdmin,
  validateQuery(orderFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const filters = req.query;

      const conditions = [];

      if (filters['status']) {
        conditions.push(eq(orders.status, filters['status'] as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'));
      }

      if (filters['paymentStatus']) {
        conditions.push(eq(orders.paymentStatus, filters['paymentStatus'] as 'pending' | 'paid' | 'refunded' | 'failed'));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

      const orderList = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, orderList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orders/:id
 * Update order (Admin only)
 */
ordersRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(updateOrderSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));

      if (!existing) {
        throw new NotFoundError('Order not found');
      }

      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
      };

      // Set shipped date if status changed to shipped
      if (data.status === 'shipped' && existing.status !== 'shipped') {
        updateData['shippedAt'] = new Date();
      }

      // Set delivered date if status changed to delivered
      if (data.status === 'delivered' && existing.status !== 'delivered') {
        updateData['deliveredAt'] = new Date();
      }

      const orderResult = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, id))
        .returning();
      const order = orderResult[0];

      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }
);
