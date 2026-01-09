import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, customers, verificationCodes, eq, and, gte, desc } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { authLimiter, verificationLimiter } from '../middleware/rateLimiter';
import { requireAuth, generateToken, getTokenExpiration } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors';
import { verificationCodeService } from '../services';
import { notificationService } from '../services/notification.service';
import { xssSanitize } from '../middleware/xss';
import { logger } from '../utils/logger';

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

const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .transform(sanitizeEmail),
});

const verifyResetCodeSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeEmail),
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

const verifyEmailSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform(sanitizeEmail),
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

const resendVerificationSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform(sanitizeEmail),
});

const resetPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeEmail),
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .refine(isStrongPassword, {
      message: 'Password must contain uppercase, lowercase, and number'
    })
    .refine(
      (p) => !WEAK_PASSWORDS.includes(p.toLowerCase()),
      { message: 'Password is too common. Please choose a stronger password.' }
    ),
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
            passwordHash,
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
            passwordHash,
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

      // Generate verification code
      const code = await verificationCodeService.createCode({
        email: customer.email,
        type: 'email_verification',
        ipAddress: req.ip,
        expiryMinutes: 15,
      });

      // Send verification email (non-blocking)
      const emailSent = await notificationService.sendEmailVerification({
        email: customer.email,
        firstName: customer.firstName,
        code,
        expiryMinutes: 15,
      });

      if (!emailSent) {
        logger.error('Failed to send verification email', {
          email: customer.email,
          customerId: customer.id,
        });
      }

      logger.info('Customer registered, verification email sent', {
        customerId: customer.id,
        email: customer.email,
      });

      // NO TOKEN, NO COOKIE - User must verify email first
      sendSuccess(res, {
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: customer.authUserId,
          email: customer.email,
          emailVerified: false,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
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

      // Verify password against stored hash
      if (!customer.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate JWT token
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
      });

      // Set httpOnly cookie for secure token storage
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
 * Logout current user (clear auth cookie)
 */
authRoutes.post('/logout', requireAuth, (_req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

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
      const db = getDb();

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email.toLowerCase()));

      if (!customer || customer.isGuest) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password against stored hash
      if (!customer.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify user has admin role
      if (customer.role !== 'admin') {
        throw new UnauthorizedError('Access denied: Admin privileges required');
      }

      // Generate JWT token with admin role
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'admin',
        customerId: customer.id,
      });

      // Set httpOnly cookie for secure token storage
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, {
        user: {
          id: customer.authUserId,
          email: customer.email,
          role: 'admin',
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
 * POST /api/auth/forgot-password
 * Request password reset code
 * Rate limited: 3 requests per hour per email
 */
authRoutes.post(
  '/forgot-password',
  verificationLimiter,
  xssSanitize,
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const db = getDb();

      // Look up customer by email (case-insensitive)
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email.toLowerCase()))
        .limit(1);

      // Security: Always return success (prevent user enumeration)
      // Process reset only if customer exists, is active, and not guest
      if (customer && customer.isActive && !customer.isGuest && customer.passwordHash) {
        // Create verification code
        const code = await verificationCodeService.createCode({
          email: customer.email,
          type: 'password_reset',
          ipAddress: req.ip,
          expiryMinutes: 15,
        });

        // Send verification code email
        const emailSent = await notificationService.sendVerificationCode({
          email: customer.email,
          code,
          type: 'password_reset',
          expiryMinutes: 15,
        });

        if (!emailSent) {
          logger.error('Failed to send password reset email', {
            email: customer.email,
            code
          });
        }

        logger.info('Password reset code sent', {
          email: customer.email,
          ip: req.ip
        });
      } else {
        // Log attempt for security monitoring
        const reason = !customer ? 'not_found'
          : !customer.isActive ? 'inactive'
          : customer.isGuest ? 'guest'
          : !customer.passwordHash ? 'no_password'
          : 'unknown';

        logger.warn('Password reset attempt for invalid account', {
          email,
          reason,
          ip: req.ip
        });

        // Small delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Always return success message (security: no user enumeration)
      sendSuccess(res, {
        message: 'If an account exists with this email, a verification code has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-reset-code
 * Validate password reset code
 * Purpose: Frontend can validate code before showing password reset form
 * Rate limited: 3 requests per hour per email
 */
authRoutes.post(
  '/verify-reset-code',
  verificationLimiter,
  xssSanitize,
  validateBody(verifyResetCodeSchema),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const db = getDb();
      const now = new Date();

      // Find the most recent active code for this email/type
      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.email, email.toLowerCase()),
            eq(verificationCodes.type, 'password_reset'),
            eq(verificationCodes.isUsed, false),
            gte(verificationCodes.expiresAt, now)
          )
        )
        .orderBy(desc(verificationCodes.createdAt))
        .limit(1);

      if (!record) {
        logger.warn('Verification code not found or expired', { email, type: 'password_reset' });
        throw new BadRequestError('Invalid or expired verification code');
      }

      // Check if max attempts exceeded
      if (record.attempts >= record.maxAttempts) {
        logger.warn('Max verification attempts exceeded', { email, type: 'password_reset', attempts: record.attempts });
        throw new BadRequestError('Maximum verification attempts exceeded. Please request a new code.');
      }

      // Increment attempts
      await db
        .update(verificationCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(verificationCodes.id, record.id));

      // Validate code
      if (record.code !== code) {
        logger.warn('Invalid verification code attempt', { email, type: 'password_reset', attempts: record.attempts + 1 });
        throw new BadRequestError('Invalid verification code');
      }

      // Code is valid - DO NOT mark as used (preserves for actual reset)
      logger.info('Password reset code verified', {
        email: email.toLowerCase()
      });

      sendSuccess(res, {
        valid: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password with valid verification code
 * Auto-logins user with new JWT token
 * Rate limited: 5 requests per 15 minutes (authLimiter)
 */
authRoutes.post(
  '/reset-password',
  authLimiter,
  xssSanitize,
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { email, code, newPassword } = req.body;
      const normalizedEmail = email.toLowerCase();
      const db = getDb();

      // Validate code (throws if invalid/expired/max attempts)
      const isValid = await verificationCodeService.validateCode({
        email: normalizedEmail,
        code,
        type: 'password_reset',
      });

      if (!isValid) {
        throw new BadRequestError('Invalid or expired verification code');
      }

      // Look up customer
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail))
        .limit(1);

      if (!customer) {
        logger.error('Customer not found after valid code validation', {
          email: normalizedEmail
        });
        throw new BadRequestError('Invalid verification code');
      }

      // Additional security checks
      if (!customer.isActive) {
        logger.warn('Password reset attempt for inactive account', {
          customerId: customer.id
        });
        throw new BadRequestError('Account is inactive');
      }

      if (customer.isGuest) {
        logger.warn('Password reset attempt for guest account', {
          customerId: customer.id
        });
        throw new BadRequestError('Invalid account type');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db
        .update(customers)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customer.id));

      // Invalidate all password_reset codes for this email
      await verificationCodeService.invalidateCodes(
        normalizedEmail,
        'password_reset'
      );

      // Send password changed confirmation email (non-blocking)
      const emailSent = await notificationService.sendPasswordChangedConfirmation({
        email: customer.email,
        firstName: customer.firstName,
        timestamp: new Date(),
        ipAddress: req.ip,
      });

      if (!emailSent) {
        logger.error('Failed to send password changed email', {
          email: customer.email,
          customerId: customer.id
        });
        // Continue - don't fail the password reset if email fails
      }

      // Generate new JWT token (auto-login)
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
      });

      // Set auth cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.info('Password reset successful', {
        customerId: customer.id,
        email: customer.email
      });

      // Return user object and token (same as login)
      sendSuccess(res, {
        message: 'Password reset successfully',
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
 * POST /api/auth/verify-email
 * Verify email address with code and auto-login
 *
 * Request body:
 * {
 *   email: string,
 *   code: string
 * }
 *
 * Response:
 * {
 *   user: { id, email, emailVerified, firstName, lastName },
 *   token: string,
 *   expiresAt: string
 * }
 *
 * Rate limit: 3 requests per hour (via verificationLimiter)
 * Security: Auto-login after successful verification
 */
authRoutes.post(
  '/verify-email',
  verificationLimiter,
  xssSanitize,
  validateBody(verifyEmailSchema),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const db = getDb();

      // Validate verification code
      const isValid = await verificationCodeService.validateCode({
        email: normalizedEmail,
        code,
        type: 'email_verification',
      });

      if (!isValid) {
        return sendError(res, 'Invalid or expired verification code.', 400);
      }

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail))
        .limit(1);

      if (!customer || customer.isGuest) {
        return sendError(res, 'Invalid verification code.', 400);
      }

      // Check if already verified
      if (customer.emailVerified) {
        return sendError(res, 'Email already verified.', 400);
      }

      // Update customer: mark email as verified
      await db
        .update(customers)
        .set({
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customer.id));

      // Invalidate all email_verification codes for this email
      await verificationCodeService.invalidateCodes(
        normalizedEmail,
        'email_verification'
      );

      logger.info('Email verified successfully', {
        email: customer.email,
        customerId: customer.id,
      });

      // Generate JWT token (auto-login after verification)
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
      });

      // Set httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const user = {
        id: customer.authUserId,
        email: customer.email,
        emailVerified: true,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        role: 'customer',
        customerId: customer.id,
      };

      sendSuccess(res, {
        message: 'Email verified successfully',
        user,
        token,
        expiresAt: getTokenExpiration().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response:
 * {
 *   message: string (generic success message)
 * }
 *
 * Rate limit: 3 requests per hour (via verificationLimiter)
 * Security: No user enumeration, always returns success
 */
authRoutes.post(
  '/resend-verification',
  verificationLimiter,
  xssSanitize,
  validateBody(resendVerificationSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();
      const db = getDb();

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail))
        .limit(1);

      // Only send if account exists, is not guest, and is not verified
      if (customer && !customer.isGuest && !customer.emailVerified) {
        // Invalidate previous codes
        await verificationCodeService.invalidateCodes(
          normalizedEmail,
          'email_verification'
        );

        // Generate new verification code
        const code = await verificationCodeService.createCode({
          email: customer.email,
          type: 'email_verification',
          ipAddress: req.ip,
          expiryMinutes: 15,
        });

        // Send verification email
        const emailSent = await notificationService.sendEmailVerification({
          email: customer.email,
          firstName: customer.firstName,
          code,
          expiryMinutes: 15,
        });

        if (!emailSent) {
          logger.error('Failed to send verification email', {
            email: customer.email,
            customerId: customer.id,
          });
        } else {
          logger.info('Verification email resent', {
            email: customer.email,
            customerId: customer.id,
          });
        }
      }

      // Always return success (no user enumeration)
      sendSuccess(res, {
        message: 'If an unverified account exists, a verification code has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }
);
