import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, customers, addresses, orders, eq, sql, desc, like, or, and } from '@lab404/database';
import { validateBody, validateQuery } from '../middleware/validator';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNoContent, createPaginationMeta, parsePaginationParams } from '../utils/response';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { PasswordSecurityService } from '../services/password-security.service';
import { notificationService } from '../services/notification.service';

export const customersRoutes = Router();

// ===========================================
// Validation Schemas
// ===========================================

// Common weak passwords to reject
const WEAK_PASSWORDS = [
  '123456', '123456789', 'qwerty', 'password', '12345678',
  '111111', '1234567890', '1234567', 'password1', '123123',
  'abc123', 'qwerty123', '1q2w3e4r', 'admin', 'letmein',
  'welcome', 'monkey', 'dragon', 'master', 'login'
];

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .refine(
      (password) => {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasUppercase && hasLowercase && hasNumber;
      },
      { message: 'Password must contain uppercase, lowercase, and number' }
    )
    .refine(
      (password) => !WEAK_PASSWORDS.includes(password.toLowerCase()),
      { message: 'Password is too common. Please choose a stronger password.' }
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const addressSchema = z.object({
  type: z.enum(['shipping', 'billing'], {
    errorMap: () => ({ message: 'Address type must be shipping or billing' })
  }),
  isDefault: z.boolean().optional().default(false),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  company: z.string()
    .max(255, 'Company must be less than 255 characters')
    .optional(),
  addressLine1: z.string()
    .min(1, 'Address is required')
    .max(255, 'Address must be less than 255 characters'),
  addressLine2: z.string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional(),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  state: z.string()
    .max(100, 'State must be less than 100 characters')
    .optional(),
  postalCode: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional(),
  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters'),
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .regex(/^[+]?[\d\s\-().]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

const customerFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  isGuest: z.enum(['true', 'false']).optional(),
});

const adminUpdateCustomerSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  firstName: z.string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be less than 100 characters')
    .optional(),
  phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .regex(/^[+]?[\d\s\-().]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  isGuest: z.boolean().optional(),
  isActive: z.boolean().optional(),
  acceptsMarketing: z.boolean().optional(),
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional(),
  tags: z.array(
    z.string().max(50, 'Each tag must be less than 50 characters')
  ).optional(),
});

const createCustomerSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  firstName: z.string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be less than 100 characters')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be less than 100 characters')
    .optional(),
  phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .regex(/^[+]?[\d\s\-().]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  isGuest: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  acceptsMarketing: z.boolean().optional().default(false),
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional(),
  tags: z.array(
    z.string().max(50, 'Each tag must be less than 50 characters')
  ).optional(),
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

/**
 * PUT /api/customers/me/password
 * Change customer password
 */
customersRoutes.put(
  '/me/password',
  requireAuth,
  validateBody(changePasswordSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const customerId = req.user?.customerId;
      const { currentPassword, newPassword } = req.body;

      if (!customerId) {
        throw new ForbiddenError('Customer not found');
      }

      // Get customer with password hash and email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer || !customer.passwordHash) {
        throw new NotFoundError('Customer not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, customer.passwordHash);
      if (!isPasswordValid) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Validate new password with security checks
      const userInputs = [customer.email, customer.firstName, customer.lastName].filter(Boolean) as string[];
      const validation = await PasswordSecurityService.validatePassword(
        newPassword,
        customerId,
        userInputs
      );

      if (!validation.isValid) {
        throw new BadRequestError(validation.errors.join('. '));
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db
        .update(customers)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));

      // Record password change in history
      await PasswordSecurityService.recordPasswordChange({
        customerId,
        passwordHash: newPasswordHash,
        changeReason: 'user_action',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      // Send confirmation email (non-blocking)
      notificationService.sendPasswordChangedConfirmation({
        email: customer.email,
        firstName: customer.firstName,
        changedAt: new Date(),
        ipAddress: req.ip || req.socket.remoteAddress,
      }).catch((error) => {
        console.error('Failed to send password change confirmation:', error);
      });

      sendSuccess(res, { message: 'Password changed successfully' });
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
          orderCount: sql<number>`COUNT(${orders.id})`.as('order_count'),
          paidOrders: sql<number>`COUNT(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 END)`.as('paid_orders'),
          unpaidOrders: sql<number>`COUNT(CASE WHEN ${orders.paymentStatus} != 'paid' AND ${orders.id} IS NOT NULL THEN 1 END)`.as('unpaid_orders'),
          totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN ${orders.totalSnapshot} ELSE 0 END), 0)`.as('total_spent'),
          debt: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} != 'paid' THEN ${orders.totalSnapshot} ELSE 0 END), 0)`.as('debt'),
          createdAt: customers.createdAt,
        })
        .from(customers)
        .leftJoin(orders, eq(orders.customerId, customers.id))
        .where(whereClause)
        .groupBy(
          customers.id,
          customers.email,
          customers.firstName,
          customers.lastName,
          customers.phone,
          customers.isGuest,
          customers.isActive,
          customers.createdAt
        )
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      // Map orderCount to totalOrders for frontend consistency
      const formattedList = customerList.map(c => ({
        ...c,
        totalOrders: c.orderCount,
        paidOrders: Number(c.paidOrders),
        unpaidOrders: Number(c.unpaidOrders),
        totalSpent: Number(c.totalSpent),
        debt: Number(c.debt),
        orderCount: undefined,
      }));

      sendSuccess(res, formattedList, 200, createPaginationMeta(page, limit, Number(count)));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/customers
 * Create new customer (Admin only)
 */
customersRoutes.post(
  '/',
  requireAuth,
  requireAdmin,
  validateBody(createCustomerSchema),
  async (req, res, next) => {
    try {
      const db = getDb();
      const data = req.body;

      // Check if email already exists
      const [existingCustomer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.email, data.email));

      if (existingCustomer) {
        throw new BadRequestError('A customer with this email already exists');
      }

      // Create customer
      const customerResult = await db
        .insert(customers)
        .values({
          email: data.email,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          phone: data.phone || null,
          isGuest: data.isGuest ?? false,
          isActive: data.isActive ?? true,
          acceptsMarketing: data.acceptsMarketing ?? false,
          notes: data.notes || null,
          tags: data.tags || null,
        })
        .returning();
      const customer = customerResult[0];

      sendCreated(res, customer);
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

    // Calculate total spent (paid orders only)
    const totalSpentResult = await db
      .select({
        totalSpent: sql<number>`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customerId, id),
          eq(orders.paymentStatus, 'paid')
        )
      );
    const totalSpent = Number(totalSpentResult[0]?.totalSpent ?? 0);

    // Calculate debt (unpaid orders)
    const debtResult = await db
      .select({
        debt: sql<number>`COALESCE(SUM(CAST(${orders.totalSnapshot} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customerId, id),
          sql`${orders.paymentStatus} != 'paid'`
        )
      );
    const debt = Number(debtResult[0]?.debt ?? 0);

    // Calculate order counts
    const orderCountsResult = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        paidOrders: sql<number>`COUNT(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 END)`,
        unpaidOrders: sql<number>`COUNT(CASE WHEN ${orders.paymentStatus} != 'paid' THEN 1 END)`,
      })
      .from(orders)
      .where(eq(orders.customerId, id));
    const totalOrders = Number(orderCountsResult[0]?.totalOrders ?? 0);
    const paidOrders = Number(orderCountsResult[0]?.paidOrders ?? 0);
    const unpaidOrders = Number(orderCountsResult[0]?.unpaidOrders ?? 0);

    sendSuccess(res, {
      ...customer,
      passwordHash: undefined, // Never expose password hash
      totalOrders,
      paidOrders,
      unpaidOrders,
      totalSpent,
      debt,
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

      // Check email uniqueness if email is being updated
      if (data.email) {
        const [emailExists] = await db
          .select({ id: customers.id })
          .from(customers)
          .where(
            and(
              eq(customers.email, data.email),
              sql`${customers.id} != ${id}`
            )
          );

        if (emailExists) {
          throw new BadRequestError('A customer with this email already exists');
        }
      }

      const customerResult = await db
        .update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();
      const customer = customerResult[0];

      sendSuccess(res, {
        ...customer,
        passwordHash: undefined, // Never expose password hash
      });
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
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.totalSnapshot),
        createdAt: o.createdAt,
      })),
      200,
      createPaginationMeta(page, limit, Number(count))
    );
  } catch (error) {
    next(error);
  }
});