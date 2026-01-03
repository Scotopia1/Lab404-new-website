import { Router } from 'express';
import { z } from 'zod';
import { getDb, customers, addresses, orders, eq, sql, desc, like, or, and } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export const customersRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
});

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  isDefault: z.boolean().optional().default(false),
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

const customerFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isGuest: z.enum(['true', 'false']).optional(),
});

const adminUpdateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// Customer Profile Routes (Authenticated)
// ===========================================

/**
 * GET /api/customers/me
 * Get current customer profile
 */
customersRoutes.get('/me', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = req.user?.customerId;

    if (!customerId) {
      throw new ForbiddenError('Customer not found');
    }

    const [customer] = await db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        orderCount: customers.orderCount,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get addresses
    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId));

    sendSuccess(res, {
      ...customer,
      addresses: customerAddresses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/customers/me
 * Update current customer profile
 */
customersRoutes.put(
  '/me',
  requireAuth,
  validateBody(updateProfileSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.user?.customerId;
      const data = req.body;

      if (!customerId) {
        throw new ForbiddenError('Customer not found');
      }

      const customerResult = await db
        .update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId))
        .returning({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
        });
      const customer = customerResult[0];

      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// Customer Address Routes
// ===========================================

/**
 * GET /api/customers/me/addresses
 * Get customer addresses
 */
customersRoutes.get('/me/addresses', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = req.user?.customerId;

    if (!customerId) {
      throw new ForbiddenError('Customer not found');
    }

    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId));

    sendSuccess(res, customerAddresses);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers/me/addresses
 * Add new address
 */
customersRoutes.post(
  '/me/addresses',
  requireAuth,
  validateBody(addressSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.user?.customerId;
      const data = req.body;

      if (!customerId) {
        throw new ForbiddenError('Customer not found');
      }

      // If setting as default, unset other defaults of same type
      if (data.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(addresses.customerId, customerId),
              eq(addresses.type, data.type)
            )
          );
      }

      const addressResult = await db
        .insert(addresses)
        .values({
          customerId,
          ...data,
        })
        .returning();
      const address = addressResult[0];

      sendCreated(res, address);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/customers/me/addresses/:id
 * Update address
 */
customersRoutes.put(
  '/me/addresses/:id',
  requireAuth,
  validateBody(addressSchema.partial()),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.user?.customerId;
      const id = req.params['id'] as string;
      const data = req.body;

      if (!customerId) {
        throw new ForbiddenError('Customer not found');
      }

      // Verify ownership
      const [existing] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, id),
            eq(addresses.customerId, customerId)
          )
        );

      if (!existing) {
        throw new NotFoundError('Address not found');
      }

      // If setting as default, unset other defaults of same type
      if (data.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(addresses.customerId, customerId),
              eq(addresses.type, data.type || existing.type)
            )
          );
      }

      const addressResult = await db
        .update(addresses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, id))
        .returning();
      const address = addressResult[0];

      sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/customers/me/addresses/:id
 * Delete address
 */
customersRoutes.delete('/me/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = req.user?.customerId;
    const id = req.params['id'] as string;

    if (!customerId) {
      throw new ForbiddenError('Customer not found');
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(
        and(
          eq(addresses.id, id),
          eq(addresses.customerId, customerId)
        )
      );

    if (!existing) {
      throw new NotFoundError('Address not found');
    }

    await db.delete(addresses).where(eq(addresses.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Routes
// ===========================================

/**
 * GET /api/customers
 * List all customers (Admin only)
 */
customersRoutes.get(
  '/',
  requireAuth,
  requireAdmin,
  validateQuery(customerFiltersSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);
      const search = req.query['search'];
      const isGuest = req.query['isGuest'];

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            like(customers.email, `%${search}%`),
            like(customers.firstName, `%${search}%`),
            like(customers.lastName, `%${search}%`)
          )
        );
      }

      if (isGuest !== undefined) {
        conditions.push(eq(customers.isGuest, isGuest === 'true'));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);
      const count = countResult[0]?.count ?? 0;

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
        .where(whereClause)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, customerList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/customers/:id
 * Get customer details (Admin only)
 */
customersRoutes.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get addresses
    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, id));

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalSnapshot: orders.totalSnapshot,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    sendSuccess(res, {
      ...customer,
      passwordHash: undefined, // Never expose password hash
      addresses: customerAddresses,
      recentOrders: recentOrders.map(o => ({
        ...o,
        totalSnapshot: Number(o.totalSnapshot),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/customers/:id
 * Update customer (Admin only)
 */
customersRoutes.put(
  '/:id',
  requireAuth,
  requireAdmin,
  validateBody(adminUpdateCustomerSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const id = req.params['id'] as string;
      const data = req.body;

      const [existing] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, id));

      if (!existing) {
        throw new NotFoundError('Customer not found');
      }

      const customerResult = await db
        .update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          isGuest: customers.isGuest,
          isActive: customers.isActive,
          orderCount: customers.orderCount,
        });
      const customer = customerResult[0];

      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/customers/:id
 * Soft delete customer (Admin only)
 */
customersRoutes.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;

    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, id));

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    // Soft delete - just deactivate
    await db
      .update(customers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Admin Customer Address Routes
// ===========================================

/**
 * GET /api/customers/:id/addresses
 * Get customer addresses (Admin only)
 */
customersRoutes.get('/:id/addresses', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const customerId = req.params['id'] as string;

    // Verify customer exists
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const customerAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId));

    sendSuccess(res, customerAddresses);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/customers/:id/addresses
 * Add address to customer (Admin only)
 */
customersRoutes.post(
  '/:id/addresses',
  requireAuth,
  requireAdmin,
  validateBody(addressSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.params['id'] as string;
      const data = req.body;

      // Verify customer exists
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // If setting as default, unset other defaults of same type
      if (data.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(addresses.customerId, customerId),
              eq(addresses.type, data.type)
            )
          );
      }

      const addressResult = await db
        .insert(addresses)
        .values({
          customerId,
          ...data,
        })
        .returning();
      const address = addressResult[0];

      sendCreated(res, address);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/customers/:id/addresses/:addressId
 * Update customer address (Admin only)
 */
customersRoutes.put(
  '/:id/addresses/:addressId',
  requireAuth,
  requireAdmin,
  validateBody(addressSchema.partial()),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.params['id'] as string;
      const addressId = req.params['addressId'] as string;
      const data = req.body;

      // Verify customer exists
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Verify address belongs to customer
      const [existing] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.id, addressId),
            eq(addresses.customerId, customerId)
          )
        );

      if (!existing) {
        throw new NotFoundError('Address not found');
      }

      // If setting as default, unset other defaults of same type
      if (data.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(
            and(
              eq(addresses.customerId, customerId),
              eq(addresses.type, data.type || existing.type)
            )
          );
      }

      const addressResult = await db
        .update(addresses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(addresses.id, addressId))
        .returning();
      const address = addressResult[0];

      sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/customers/:id/addresses/:addressId
 * Delete customer address (Admin only)
 */
customersRoutes.delete(
  '/:id/addresses/:addressId',
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.params['id'] as string;
      const addressId = req.params['addressId'] as string;

      // Verify address belongs to customer
      const [existing] = await db
        .select({ id: addresses.id })
        .from(addresses)
        .where(
          and(
            eq(addresses.id, addressId),
            eq(addresses.customerId, customerId)
          )
        );

      if (!existing) {
        throw new NotFoundError('Address not found');
      }

      await db.delete(addresses).where(eq(addresses.id, addressId));

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/customers/:id/orders
 * Get customer orders (Admin only)
 */
customersRoutes.get('/:id/orders', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const db = getDb();
    const id = req.params['id'] as string;
    const { page, limit, offset } = parsePaginationParams(req.query as Record<string, string>);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, id));
    const count = countResult[0]?.count ?? 0;

    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    sendSuccess(
      res,
      orderList.map(o => ({
        ...o,
        subtotalSnapshot: Number(o.subtotalSnapshot),
        taxAmountSnapshot: Number(o.taxAmountSnapshot),
        shippingAmountSnapshot: Number(o.shippingAmountSnapshot),
        discountAmountSnapshot: Number(o.discountAmountSnapshot),
        totalSnapshot: Number(o.totalSnapshot),
      })),
      200,
      createPaginationMeta(page, limit, Number(count))
    );
  } catch (error) {
    next(error);
  }
});
