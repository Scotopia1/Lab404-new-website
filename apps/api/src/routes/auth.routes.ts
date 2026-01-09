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
import { sessionService } from '../services/session.service';
import { PasswordSecurityService } from '../services/password-security.service';
import { LoginAttemptService } from '../services/login-attempt.service';
import { auditLogService } from '../services/audit-log.service';
import { SecurityEventType, ActorType, EventStatus } from '../types/audit-events';
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

      // Log account creation
      await auditLogService.logFromRequest(req, {
        eventType: SecurityEventType.ACCOUNT_CREATED,
        actorType: ActorType.CUSTOMER,
        actorId: customer.id,
        actorEmail: customer.email,
        action: 'account_registration',
        status: EventStatus.SUCCESS,
        metadata: {
          registrationType: existing && existing.isGuest ? 'guest_conversion' : 'new',
          emailVerified: false,
        },
      });

      // Log email verification sent
      await auditLogService.logFromRequest(req, {
        eventType: SecurityEventType.EMAIL_VERIFICATION_SENT,
        actorType: ActorType.SYSTEM,
        targetType: 'customer',
        targetId: customer.id,
        action: 'send_verification_email',
        status: EventStatus.SUCCESS,
        metadata: {
          email: customer.email,
          expiryMinutes: 15,
        },
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
      const normalizedEmail = email.toLowerCase();
      const db = getDb();

      // Extract device info for logging
      const deviceInfo = {
        ipAddress: req.ip || req.socket.remoteAddress || '',
        userAgent: req.headers['user-agent'],
      };

      // Check lockout status BEFORE any other checks
      const lockoutStatus = await LoginAttemptService.checkLockoutStatus(normalizedEmail);
      if (lockoutStatus.isLocked) {
        const remainingTime = LoginAttemptService.formatRemainingTime(
          lockoutStatus.remainingTime || 0
        );

        logger.warn('Login blocked: Account locked', {
          email: normalizedEmail,
          remainingTime,
        });

        // Log lockout event
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_LOCKED,
          actorType: ActorType.CUSTOMER,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.DENIED,
          metadata: {
            reason: 'account_locked',
            remainingTime: lockoutStatus.remainingTime,
            lockoutEndTime: lockoutStatus.lockoutEndTime?.toISOString(),
          },
        });

        return sendError(
          res,
          403,
          'ACCOUNT_LOCKED',
          `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingTime}.`
        );
      }

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail));

      if (!customer || customer.isGuest) {
        // Record failed attempt (no customer ID)
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          null,
          'invalid_credentials',
          deviceInfo
        );

        // Log failed login
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_FAILURE,
          actorType: ActorType.CUSTOMER,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.FAILURE,
          metadata: { reason: 'invalid_credentials' },
        });

        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password against stored hash
      if (!customer.passwordHash) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          'invalid_credentials',
          deviceInfo
        );

        // Log failed login
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_FAILURE,
          actorType: ActorType.CUSTOMER,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.FAILURE,
          metadata: { reason: 'no_password_hash' },
        });

        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);
      if (!isPasswordValid) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          'invalid_credentials',
          deviceInfo
        );

        // Log failed login
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_FAILURE,
          actorType: ActorType.CUSTOMER,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.FAILURE,
          metadata: { reason: 'invalid_password' },
        });

        throw new UnauthorizedError('Invalid email or password');
      }

      // Check email verification status
      if (!customer.emailVerified) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          'email_unverified',
          deviceInfo
        );

        logger.info('Login blocked: Email not verified', {
          email: customer.email,
          customerId: customer.id,
        });

        // Log failed login
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_FAILURE,
          actorType: ActorType.CUSTOMER,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.DENIED,
          metadata: { reason: 'email_unverified' },
        });

        return sendError(
          res,
          403,
          'EMAIL_NOT_VERIFIED',
          'Email not verified. Please check your inbox for the verification code.'
        );
      }

      // Check if account is disabled
      if (!customer.isActive) {
        await LoginAttemptService.recordAttempt(
          normalizedEmail,
          false,
          customer.id,
          'account_disabled',
          deviceInfo
        );

        logger.warn('Login blocked: Account disabled', {
          email: customer.email,
          customerId: customer.id,
        });

        // Log failed login
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.AUTH_LOGIN_FAILURE,
          actorType: ActorType.CUSTOMER,
          actorId: customer.id,
          actorEmail: normalizedEmail,
          action: 'login_attempt',
          status: EventStatus.DENIED,
          metadata: { reason: 'account_disabled' },
        });

        throw new UnauthorizedError('Account is disabled. Please contact support.');
      }

      // Record successful login attempt
      await LoginAttemptService.recordAttempt(
        normalizedEmail,
        true,
        customer.id,
        null,
        deviceInfo
      );

      // Clear any failed attempts and unlock account
      await LoginAttemptService.clearFailedAttempts(normalizedEmail);

      // Create session
      const sessionId = await sessionService.createSession({
        customerId: customer.id,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.socket.remoteAddress || '',
      });

      // Generate JWT token with sessionId
      const token = generateToken({
        userId: customer.authUserId!,
        email: customer.email,
        role: 'customer',
        customerId: customer.id,
        sessionId,
      });

      // Store token hash in session
      await sessionService.setTokenHash(sessionId, token);

      // Set httpOnly cookie for secure token storage
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Log successful login
      await auditLogService.logFromRequest(req, {
        eventType: SecurityEventType.AUTH_LOGIN_SUCCESS,
        actorType: ActorType.CUSTOMER,
        actorId: customer.id,
        actorEmail: customer.email,
        action: 'login',
        status: EventStatus.SUCCESS,
        metadata: {
          sessionId,
          deviceType: deviceInfo.userAgent,
        },
      });

      logger.info('Login successful', {
        email: customer.email,
        customerId: customer.id,
        sessionId,
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
authRoutes.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const sessionId = req.user?.sessionId;

    // Revoke session if present
    if (sessionId) {
      await sessionService.revokeSession(sessionId, 'user_action');
      logger.info('Session revoked on logout', {
        sessionId,
        customerId: req.user?.customerId,
      });
    }

    // Log logout event
    await auditLogService.logFromRequest(req, {
      eventType: SecurityEventType.AUTH_LOGOUT,
      actorType: ActorType.CUSTOMER,
      actorId: req.user?.customerId,
      actorEmail: req.user?.email,
      action: 'logout',
      status: EventStatus.SUCCESS,
      metadata: {
        sessionId,
      },
    });

    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
    });

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
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

      // TODO: Implement proper admin role checking
      // Currently, any customer can get an admin token through this endpoint
      // Need to add isAdmin field to customers table or create separate admins table

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
        secure: process.env['NODE_ENV'] === 'production',
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

        // Log password reset requested event
        await auditLogService.logFromRequest(req, {
          eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
          actorType: ActorType.CUSTOMER,
          actorId: customer.id,
          actorEmail: customer.email,
          action: 'password_reset_request',
          status: EventStatus.SUCCESS,
          metadata: {
            method: 'email_code',
            expiryMinutes: 15,
          },
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

      // Validate new password with security checks
      const userInputs = [customer.email, customer.firstName, customer.lastName].filter(Boolean) as string[];
      const validation = await PasswordSecurityService.validatePassword(
        newPassword,
        customer.id,
        userInputs
      );

      if (!validation.isValid) {
        logger.warn('Password reset rejected due to security checks', {
          customerId: customer.id,
          errors: validation.errors
        });
        throw new BadRequestError(validation.errors.join('. '));
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

      // Record password change in history
      await PasswordSecurityService.recordPasswordChange({
        customerId: customer.id,
        passwordHash,
        changeReason: 'password_reset',
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      // Log password reset completed event
      await auditLogService.logFromRequest(req, {
        eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
        actorType: ActorType.CUSTOMER,
        actorId: customer.id,
        actorEmail: customer.email,
        action: 'password_reset_complete',
        status: EventStatus.SUCCESS,
        metadata: {
          method: 'email_code',
          strengthScore: validation.strengthResult?.score,
        },
      });

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
        secure: process.env['NODE_ENV'] === 'production',
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
        return sendError(res, 400, 'INVALID_CODE', 'Invalid or expired verification code.');
      }

      // Find customer by email
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail))
        .limit(1);

      if (!customer || customer.isGuest) {
        return sendError(res, 400, 'INVALID_CODE', 'Invalid verification code.');
      }

      // Check if already verified
      if (customer.emailVerified) {
        return sendError(res, 400, 'ALREADY_VERIFIED', 'Email already verified.');
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

      // Log account verified event
      await auditLogService.logFromRequest(req, {
        eventType: SecurityEventType.ACCOUNT_VERIFIED,
        actorType: ActorType.CUSTOMER,
        actorId: customer.id,
        actorEmail: customer.email,
        action: 'email_verification',
        status: EventStatus.SUCCESS,
        metadata: {
          verificationMethod: 'email_code',
          verifiedAt: new Date().toISOString(),
        },
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
        secure: process.env['NODE_ENV'] === 'production',
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

/**
 * POST /api/auth/password/check
 * Check password strength and breach status
 *
 * Request body:
 * {
 *   password: string,
 *   email?: string,        // Optional: for personalized feedback
 *   customerId?: string    // Optional: for history checking
 * }
 *
 * Response:
 * {
 *   score: number,         // 0-4 (zxcvbn)
 *   feedback: {
 *     warning: string,
 *     suggestions: string[]
 *   },
 *   crackTime: string,
 *   isBreached: boolean,
 *   breachCount: number,
 *   isReused: boolean
 * }
 *
 * Rate limit: 10 requests per 15 minutes
 */
const passwordCheckSchema = z.object({
  password: z.string().min(1),
  email: z.string().email().optional(),
  customerId: z.string().uuid().optional(),
});

authRoutes.post(
  '/password/check',
  authLimiter,
  validateBody(passwordCheckSchema),
  async (req, res, next) => {
    try {
      const { password, email, customerId } = req.body;

      // Build user inputs for personalized feedback
      const userInputs: string[] = [];
      if (email) {
        userInputs.push(email);
        const emailParts = email.split('@');
        userInputs.push(emailParts[0]); // Add username part
      }

      // If customerId provided, check history and breach
      let result;
      if (customerId) {
        const validation = await PasswordSecurityService.validatePassword(
          password,
          customerId,
          userInputs
        );
        result = validation.strengthResult;
      } else {
        // New user - just check strength and breach
        const validation = await PasswordSecurityService.validateNewPassword(
          password,
          userInputs
        );
        result = validation.strengthResult;
      }

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);
