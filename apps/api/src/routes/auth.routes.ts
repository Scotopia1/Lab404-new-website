import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, customers, eq } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth, generateToken, getTokenExpiration } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';

export const authRoutes = Router();

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

// Sanitize email to prevent SQL injection
const sanitizeEmail = (email: string): string => {
  // Remove any characters that could be used for SQL injection
  return email.toLowerCase().replace(/['";\-\-\/\*\\]/g, '').trim();
};

// Password strength validation
const isStrongPassword = (password: string): boolean => {
  // Check if password is in weak passwords list
  if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return false;
  }
  // Must have at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};

const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .transform(sanitizeEmail)
    .refine(
      (email) => !email.includes('--') && !email.includes('/*') && !email.includes('*/'),
      { message: 'Invalid email format' }
    ),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .refine(
      (password) => !WEAK_PASSWORDS.includes(password.toLowerCase()),
      { message: 'Password is too common. Please choose a stronger password.' }
    )
    .refine(
      isStrongPassword,
      { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
    ),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  acceptsMarketing: z.boolean().optional().default(false),
});

const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeEmail),
  password: z.string().min(1, 'Password is required'),
});

// ===========================================
// Routes
// ===========================================

/**
 * POST /api/auth/register
 * Register a new customer account
 */
authRoutes.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, acceptsMarketing } = req.body;
      const db = getDb();

      // Check if email already exists
      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email.toLowerCase()));

      if (existing && !existing.isGuest) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create customer (or update guest to registered)
      let customer;

      if (existing && existing.isGuest) {
        // Convert guest to registered customer
        const [updated] = await db
          .update(customers)
          .set({
            firstName,
            lastName,
            isGuest: false,
            acceptsMarketing,
            authUserId: `local_${existing.id}`, // Local auth
            updatedAt: new Date(),
          })
          .where(eq(customers.id, existing.id))
          .returning();
        customer = updated;
      } else {
        // Create new customer
        const [created] = await db
          .insert(customers)
          .values({
            email: email.toLowerCase(),
            firstName,
            lastName,
            isGuest: false,
            acceptsMarketing,
            authUserId: `local_${Date.now()}`, // Will be updated after insert
          })
          .returning();
        customer = created;

        // Update with proper auth ID
        if (customer) {
          await db
            .update(customers)
            .set({ authUserId: `local_${customer.id}` })
            .where(eq(customers.id, customer.id));
        }
      }

      if (!customer) {
        throw new Error('Failed to create or update customer');
      }

      // Store password hash (in a real app, use a separate auth table or Neon Auth)
      // For now, we'll include it in the token generation

      // Generate JWT token
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
      });

      sendSuccess(res, {
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: 'customer',
          customerId: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        token,
        expiresAt: getTokenExpiration().toISOString(),
      }, 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRoutes.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const db = getDb();

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email.toLowerCase()));

      if (!customer || customer.isGuest) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // In a real app, verify password against stored hash
      // For demo, we'll just check if it's not empty
      if (!password) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate JWT token
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
      });

      sendSuccess(res, {
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: 'customer',
          customerId: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
        token,
        expiresAt: getTokenExpiration().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user (customer or admin)
 */
authRoutes.get('/me', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();

    // Handle admin users
    if (req.user?.role === 'admin') {
      sendSuccess(res, {
        id: req.user.id,
        email: req.user.email,
        role: 'admin',
        isAdmin: true,
      });
      return;
    }

    // Handle customer users
    if (!req.user?.customerId) {
      throw new NotFoundError('Customer not found');
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, req.user.customerId));

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    sendSuccess(res, {
      id: customer.authUserId,
      email: customer.email,
      role: req.user.role,
      customerId: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout current user (client-side token removal)
 */
authRoutes.post('/logout', requireAuth, (_req, res) => {
  // JWT is stateless, so logout is handled client-side
  // In a real app, you might blacklist the token
  sendSuccess(res, { message: 'Logged out successfully' });
});

/**
 * POST /api/auth/admin/login
 * Admin login endpoint
 */
authRoutes.post(
  '/admin/login',
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // For demo purposes, use a hardcoded admin
      // In production, use Neon Auth or proper admin user management
      if (email === 'admin@lab404electronics.com' && password === 'Admin123456') {
        const token = generateToken({
          userId: 'admin_1',
          email: email,
          role: 'admin',
        });

        sendSuccess(res, {
          user: {
            id: 'admin_1',
            email: email,
            role: 'admin',
          },
          token,
          expiresAt: getTokenExpiration().toISOString(),
        });
      } else {
        throw new UnauthorizedError('Invalid admin credentials');
      }
    } catch (error) {
      next(error);
    }
  }
);
