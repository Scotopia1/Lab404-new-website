import { Router } from 'express';
import { z } from 'zod';
import { getDb, orders, orderItems, customers, carts, cartItems, cartPromoCodes, products, productVariants, promoCodes, eq, sql, desc, and, or, ilike } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimiter';
import { sendSuccess, sendCreated, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { pricingService } from '../services/pricing.service';
import { pdfService } from '../services/pdf.service';
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
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
});

const orderFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
  search: z.string().optional(),
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

    // Build timeline with accurate timestamps
    const timeline = [
      { status: 'pending', timestamp: order.createdAt.toISOString(), description: 'Order placed' },
    ];

    if (order.status !== 'pending' && order.status !== 'cancelled' && order.confirmedAt) {
      timeline.push({ status: 'confirmed', timestamp: order.confirmedAt.toISOString(), description: 'Order confirmed' });
    }

    if (['processing', 'shipped', 'delivered'].includes(order.status) && order.processingAt) {
      timeline.push({ status: 'processing', timestamp: order.processingAt.toISOString(), description: 'Order is being processed' });
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

    // Get customer info if exists
    let customer = null;
    if (order.customerId) {
      const [customerData] = await db
        .select({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
        })
        .from(customers)
        .where(eq(customers.id, order.customerId));
      customer = customerData || null;
    }

    sendSuccess(res, {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customer,

      // Status
      status: order.status,
      paymentStatus: order.paymentStatus,

      // Financial
      currency: order.currency,
      subtotal: Number(order.subtotalSnapshot),
      taxRate: Number(order.taxRateSnapshot),
      tax: Number(order.taxAmountSnapshot),
      shipping: Number(order.shippingAmountSnapshot),
      discount: Number(order.discountAmountSnapshot),
      total: Number(order.totalSnapshot),

      // Promo
      promoCodeId: order.promoCodeId,
      promoCodeSnapshot: order.promoCodeSnapshot,

      // Payment & Shipping
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,

      // Addresses
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,

      // Notes
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,

      // Status Timestamps
      confirmedAt: order.confirmedAt?.toISOString(),
      processingAt: order.processingAt?.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),

      // Items
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productNameSnapshot,
        productImage: null,
        sku: item.skuSnapshot,
        variantOptions: item.variantOptionsSnapshot,
        quantity: item.quantity,
        price: Number(item.unitPriceSnapshot),
        total: Number(item.unitPriceSnapshot) * item.quantity,
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

      // Search by customer name, email, or order number
      if (filters['search']) {
        const searchTerm = `%${filters['search']}%`;
        conditions.push(
          or(
            ilike(orders.orderNumber, searchTerm),
            ilike(customers.email, searchTerm),
            ilike(customers.firstName, searchTerm),
            ilike(customers.lastName, searchTerm),
            sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName}) ILIKE ${searchTerm}`
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count query needs join when searching by customer fields
      const countQuery = filters['search']
        ? db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(whereClause)
        : db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(whereClause);
      const countResult = await countQuery;
      const count = countResult[0]?.count ?? 0;

      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          totalSnapshot: orders.totalSnapshot,
          shippingAddress: orders.shippingAddress,
          adminNotes: orders.adminNotes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          customer: {
            id: customers.id,
            email: customers.email,
            firstName: customers.firstName,
            lastName: customers.lastName,
          },
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      // Format the response with proper totals
      const formattedOrders = orderList.map(o => ({
        ...o,
        total: Number(o.totalSnapshot),
        customer: o.customer?.id ? o.customer : null,
      }));

      sendSuccess(res, formattedOrders, 200, createPaginationMeta(page, limit, Number(count)));
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

      // Set timestamp when status changes to confirmed
      if (data.status === 'confirmed' && existing.status !== 'confirmed') {
        updateData['confirmedAt'] = new Date();
      }

      // Set timestamp when status changes to processing
      if (data.status === 'processing' && existing.status !== 'processing') {
        updateData['processingAt'] = new Date();
      }

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

/**
 * GET /api/orders/:id/invoice
 * Download order invoice as PDF (Admin only)
 */
ordersRoutes.get(
  '/:id/invoice',
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Get order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // Get customer info
      let customer = null;
      if (order.customerId) {
        const [customerData] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, order.customerId));
        customer = customerData || null;
      }

      // Get shipping address for customer details
      const shippingAddress = order.shippingAddress as {
        firstName: string;
        lastName: string;
        phone?: string;
        company?: string;
      } | null;

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        quotationNumber: order.orderNumber,
        createdAt: order.createdAt,
        validUntil: new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || 'cod',
        paidAt: order.paymentStatus === 'paid' ? order.updatedAt : undefined,

        // Customer info
        customerName: customer
          ? `${customer.firstName} ${customer.lastName}`
          : shippingAddress
            ? `${shippingAddress.firstName} ${shippingAddress.lastName}`
            : 'Guest Customer',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || shippingAddress?.phone,
        customerCompany: shippingAddress?.company,

        // Items
        items: items.map(item => ({
          productName: item.productNameSnapshot || 'Unknown Product',
          sku: item.skuSnapshot || '',
          quantity: item.quantity,
          unitPrice: Number(item.unitPriceSnapshot),
          lineTotal: Number(item.unitPriceSnapshot) * item.quantity,
          variantOptions: item.variantOptionsSnapshot as Record<string, string> | undefined,
        })),

        // Totals
        subtotal: Number(order.subtotalSnapshot),
        taxRate: Number(order.taxRateSnapshot),
        taxAmount: Number(order.taxAmountSnapshot),
        shippingAmount: Number(order.shippingAmountSnapshot),
        discountAmount: Number(order.discountAmountSnapshot),
        total: Number(order.totalSnapshot),
        currency: order.currency || 'USD',

        // Company info (can be configured via env)
        companyName: process.env['COMPANY_NAME'] || 'Lab404',
        companyAddress: process.env['COMPANY_ADDRESS'] || '123 Business Street, City, State 12345',
        companyPhone: process.env['COMPANY_PHONE'] || '+1 (555) 123-4567',
        companyEmail: process.env['COMPANY_EMAIL'] || 'contact@lab404.com',
        companyWebsite: process.env['COMPANY_WEBSITE'] || 'https://lab404.com',
      };

      // Generate PDF
      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="invoice-${order.orderNumber}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Admin Order Creation
// ===========================================

const adminCreateOrderSchema = z.object({
  // Customer - either existing or new
  customerId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  customerFirstName: z.string().max(100).optional(),
  customerLastName: z.string().max(100).optional(),
  customerPhone: z.string().max(50).optional(),

  // Items (required)
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),

  // Addresses
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().default(true),

  // Payment
  paymentMethod: z.enum(['cod', 'bank_transfer', 'cash']),
  paymentStatus: z.enum(['pending', 'paid']).default('pending'),

  // Discounts
  promoCode: z.string().optional(),
  manualDiscount: z.number().min(0).optional(),

  // Notes
  adminNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional(),
});

/**
 * POST /api/orders/admin
 * Create a new order (Admin only - bypasses cart)
 */
ordersRoutes.post(
  '/admin',
  requireAuth,
  requireAdmin,
  validateBody(adminCreateOrderSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // 1. Resolve customer
      let customer;
      if (data.customerId) {
        // Use existing customer
        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, data.customerId));

        if (!existingCustomer) {
          throw new BadRequestError('Customer not found');
        }
        customer = existingCustomer;
      } else if (data.customerEmail) {
        // Find or create guest customer
        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(eq(customers.email, data.customerEmail.toLowerCase()));

        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          // Create new guest customer
          const [newCustomer] = await db
            .insert(customers)
            .values({
              email: data.customerEmail.toLowerCase(),
              firstName: data.customerFirstName || data.shippingAddress.firstName,
              lastName: data.customerLastName || data.shippingAddress.lastName,
              phone: data.customerPhone || data.shippingAddress.phone,
              isGuest: true,
            })
            .returning();
          customer = newCustomer;
        }
      } else {
        throw new BadRequestError('Either customerId or customerEmail is required');
      }

      if (!customer) {
        throw new BadRequestError('Failed to resolve customer');
      }

      // 2. Calculate totals using pricing service
      const cartInput = data.items.map((item: { productId: string; variantId?: string; quantity: number }) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const totals = await pricingService.calculateOrderTotals(
        cartInput,
        data.promoCode
      );

      // 3. Apply manual discount if provided
      let finalDiscount = totals.discountAmount;
      let finalTotal = totals.total;

      if (data.manualDiscount && data.manualDiscount > 0) {
        // Add manual discount (cap at remaining subtotal after promo discount)
        const maxManualDiscount = totals.subtotal - totals.discountAmount;
        const appliedManualDiscount = Math.min(data.manualDiscount, maxManualDiscount);
        finalDiscount += appliedManualDiscount;
        finalTotal = totals.subtotal - finalDiscount + totals.taxAmount + totals.shippingAmount;

        // Recalculate tax on discounted amount
        const discountedSubtotal = totals.subtotal - finalDiscount;
        const newTax = discountedSubtotal * totals.taxRate;
        finalTotal = discountedSubtotal + newTax + totals.shippingAmount;
      }

      // 4. Generate order number
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders);
      const count = countResult[0]?.count ?? 0;
      const orderNumber = generateOrderNumber(Number(count) + 1);

      // 5. Determine billing address
      const billingAddress = data.sameAsShipping
        ? data.shippingAddress
        : data.billingAddress || data.shippingAddress;

      // 6. Create order
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          customerId: customer.id,
          status: 'pending',
          paymentStatus: data.paymentStatus,
          shippingAddress: data.shippingAddress,
          billingAddress,
          currency: 'USD',
          subtotalSnapshot: String(totals.subtotal),
          taxRateSnapshot: String(totals.taxRate),
          taxAmountSnapshot: String(data.manualDiscount ? (totals.subtotal - finalDiscount) * totals.taxRate : totals.taxAmount),
          shippingAmountSnapshot: String(totals.shippingAmount),
          discountAmountSnapshot: String(finalDiscount),
          totalSnapshot: String(finalTotal),
          promoCodeId: totals.promoCodeId,
          promoCodeSnapshot: totals.promoCodeSnapshot,
          paymentMethod: data.paymentMethod,
          customerNotes: data.customerNotes,
          adminNotes: data.adminNotes,
        })
        .returning();

      if (!order) {
        throw new BadRequestError('Failed to create order');
      }

      // 7. Create order items with product snapshots
      for (const item of data.items) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product) {
          throw new BadRequestError(`Product not found: ${item.productId}`);
        }

        let variant;
        if (item.variantId) {
          const [variantResult] = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId));
          variant = variantResult;
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

      // 8. Update promo code usage if used
      if (totals.promoCodeId) {
        await db
          .update(promoCodes)
          .set({ usageCount: sql`${promoCodes.usageCount} + 1` })
          .where(eq(promoCodes.id, totals.promoCodeId));
      }

      // 9. Update customer order count
      await db
        .update(customers)
        .set({ orderCount: sql`${customers.orderCount} + 1` })
        .where(eq(customers.id, customer.id));

      sendCreated(res, {
        id: order.id,
        orderNumber: order.orderNumber,
        total: finalTotal,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orders/:id
 * Delete a cancelled order (Admin only)
 */
ordersRoutes.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, id));

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Only allow deletion of cancelled orders
      if (order.status !== 'cancelled') {
        throw new BadRequestError('Only cancelled orders can be deleted');
      }

      // Delete order items first (cascade should handle this, but being explicit)
      await db.delete(orderItems).where(eq(orderItems.orderId, id));

      // Delete the order
      await db.delete(orders).where(eq(orders.id, id));

      sendSuccess(res, { message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);
