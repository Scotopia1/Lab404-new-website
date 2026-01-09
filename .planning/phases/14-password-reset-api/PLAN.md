# Phase 14: Password Reset Backend API - Implementation Plan

## Overview
Implement 3 secure password reset API endpoints that leverage Phase 13's verification code system.

**Phase Goals**:
- ✅ POST /api/auth/forgot-password - Request password reset code
- ✅ POST /api/auth/verify-reset-code - Validate reset code
- ✅ POST /api/auth/reset-password - Reset password with valid code

**Dependencies**: Phase 13 (Email Verification Code System) ✅

**Estimated Tasks**: 4 tasks

---

## Task 1: Add Validation Schemas & Utilities

**Objective**: Create Zod validation schemas for all 3 password reset endpoints

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add required imports** (top of file):
```typescript
import { verificationCodeService } from '../services';
import { notificationService } from '../services/notification.service';
import { verificationLimiter } from '../middleware/rateLimiter';
import { xssSanitize } from '../middleware/xss';
```

2. **Create forgotPasswordSchema** (after existing schemas):
```typescript
const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255)
    .transform(sanitizeEmail),
});
```

3. **Create verifyResetCodeSchema**:
```typescript
const verifyResetCodeSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeEmail),
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});
```

4. **Create resetPasswordSchema**:
```typescript
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
```

**Validation**:
- All schemas compile without TypeScript errors
- Schemas match existing auth.routes.ts patterns

**Commit Message**: `feat(14-01): add password reset validation schemas`

---

## Task 2: Implement POST /api/auth/forgot-password Endpoint

**Objective**: Create endpoint to request password reset verification code

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add endpoint after existing auth routes**:
```typescript
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
```

**Security Considerations**:
- Always return 200 success (no email enumeration)
- Check isActive, isGuest, passwordHash flags
- Small delay for non-existent emails (timing attack prevention)
- Log all attempts for security monitoring
- Rate limited by email (3/hour)

**Validation**:
- Endpoint responds with 200 for valid and invalid emails
- Verification code created and sent for valid customers
- Rate limiting enforced (3 requests per hour per email)
- Logs all attempts appropriately

**Commit Message**: `feat(14-02): implement forgot-password endpoint`

---

## Task 3: Implement POST /api/auth/verify-reset-code Endpoint

**Objective**: Create endpoint to validate password reset code (without actually resetting)

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add endpoint after forgot-password**:
```typescript
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

      // Validate code (throws BadRequestError if invalid/expired/max attempts)
      const isValid = await verificationCodeService.validateCode({
        email: email.toLowerCase(),
        code,
        type: 'password_reset',
      });

      if (isValid) {
        logger.info('Password reset code verified', {
          email: email.toLowerCase()
        });

        sendSuccess(res, {
          valid: true,
        });
      } else {
        // This shouldn't happen (validateCode throws on failure)
        // But handle defensively
        throw new BadRequestError('Invalid or expired verification code');
      }
    } catch (error) {
      // verificationCodeService.validateCode throws:
      // - BadRequestError for invalid/expired codes
      // - TooManyRequestsError for max attempts
      next(error);
    }
  }
);
```

**Behavior**:
- Validates code existence, expiration, type match
- Increments attempt counter
- Throws BadRequestError if invalid (generic message)
- Throws TooManyRequestsError if max attempts (3) exceeded
- Does NOT mark code as used (preserves for actual reset)

**Validation**:
- Valid code returns { valid: true }
- Invalid code returns 400 error
- Expired code returns 400 error
- Max attempts returns 429 error
- Attempt counter increments

**Commit Message**: `feat(14-03): implement verify-reset-code endpoint`

---

## Task 4: Implement POST /api/auth/reset-password Endpoint

**Objective**: Create endpoint to reset password with valid code and auto-login user

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add endpoint after verify-reset-code**:
```typescript
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

      // Generate new JWT token (auto-login)
      const token = generateToken({
        userId: customer.id,
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
          id: customer.id,
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
```

**Security Flow**:
1. Validate code (verificationCodeService handles max attempts, expiration)
2. Lookup customer by email
3. Verify customer is active and not guest
4. Hash password with bcrypt (12 rounds)
5. Update passwordHash in database
6. Invalidate ALL password_reset codes for this email
7. Generate JWT token
8. Set httpOnly auth cookie
9. Return user object + token (same as login response)

**Validation**:
- Valid code + password resets password successfully
- Invalid code returns 400 error
- Expired code returns 400 error
- Inactive account returns 400 error
- Guest account returns 400 error
- Password meets strength requirements
- All password_reset codes invalidated after success
- JWT token generated and cookie set
- User can access protected endpoints immediately

**Commit Message**: `feat(14-04): implement reset-password endpoint with auto-login`

---

## Task 5: Create Test Structure Documentation

**Objective**: Document comprehensive test scenarios for Phase 22 implementation

**Files to Create**:
- `apps/api/src/routes/__tests__/auth.routes.password-reset.test.ts`

**Implementation Steps**:

1. **Create test file with documentation**:
```typescript
/**
 * Password Reset API Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22 (Security Testing & Hardening).
 * This file documents the test scenarios that should be covered.
 *
 * Test Coverage Required:
 *
 * 1. POST /api/auth/forgot-password Tests:
 *    - Sends code for valid active customer
 *    - Returns success for non-existent email (no enumeration)
 *    - Returns success for inactive customer (no enumeration)
 *    - Returns success for guest customer (no enumeration)
 *    - Rate limiting enforced (3 requests/hour per email)
 *    - Email validation (invalid format rejected)
 *    - Email sanitization (SQL injection chars removed)
 *    - Case-insensitive email matching
 *    - Logs all attempts appropriately
 *    - Invalidates previous codes when new one created
 *    - IP address stored in verification code
 *    - Email sending failure handled gracefully
 *
 * 2. POST /api/auth/verify-reset-code Tests:
 *    - Validates correct code successfully
 *    - Rejects incorrect code
 *    - Rejects expired code
 *    - Rejects code with wrong type (email_verification)
 *    - Enforces max attempts (3)
 *    - Increments attempt counter
 *    - Does NOT mark code as used on success
 *    - Rate limiting enforced (3 requests/hour per email)
 *    - Email validation
 *    - Code format validation (6 digits)
 *    - Case-insensitive email matching
 *
 * 3. POST /api/auth/reset-password Tests:
 *    - Resets password with valid code
 *    - Hashes password with bcrypt
 *    - Invalidates all password_reset codes after success
 *    - Generates JWT token
 *    - Sets httpOnly auth cookie
 *    - Returns user object and token
 *    - Rejects invalid code
 *    - Rejects expired code
 *    - Rejects code with max attempts
 *    - Rejects weak password (fails strength validation)
 *    - Rejects common password (in WEAK_PASSWORDS list)
 *    - Rejects inactive customer
 *    - Rejects guest customer
 *    - Password length validation (8-100 chars)
 *    - Password strength validation (uppercase, lowercase, number)
 *    - Rate limiting enforced (5 requests/15min)
 *    - Email validation
 *    - Code format validation
 *    - Updates customer.updatedAt timestamp
 *    - Auto-login works (token valid for protected endpoints)
 *
 * 4. Security Tests:
 *    - No user enumeration (forgot-password always returns success)
 *    - Timing attack prevention (constant response time)
 *    - Rate limiting per email (not just IP)
 *    - XSS sanitization applied
 *    - SQL injection prevention (email sanitization)
 *    - Type isolation (password_reset codes only)
 *    - Code reuse prevention (single-use enforcement)
 *    - Max attempts lockout (3 attempts)
 *    - Expiration enforcement (15 minutes)
 *    - httpOnly cookie (JavaScript cannot access)
 *    - Secure cookie in production
 *    - SameSite strict cookie
 *
 * 5. Edge Cases:
 *    - Multiple concurrent reset requests (latest code valid)
 *    - Reset with old code after new code created (fails)
 *    - Reset attempt with email_verification code (fails)
 *    - Customer with null passwordHash (fails gracefully)
 *    - Email with different casing (User@example.com vs user@example.com)
 *    - Unicode characters in password
 *    - Password exactly 8 chars (minimum)
 *    - Password exactly 100 chars (maximum)
 *    - Code validation after expiration
 *    - Code validation after being used
 *
 * 6. Integration Tests:
 *    - Full flow: forgot → verify → reset → login
 *    - Email sent with correct code
 *    - Email template rendered correctly
 *    - Database state after each operation
 *    - Error messages are generic (no details leaked)
 *    - Logs contain appropriate information
 *
 * Implementation Details:
 * - Use @jest/globals for test framework
 * - Clean database before each test
 * - Test email: test@example.com
 * - Mock email sending (don't send real emails in tests)
 * - Verify database state after operations
 * - Test error messages and status codes
 * - Use supertest for HTTP requests
 *
 * Example Test Structure:
 *
 * describe('Password Reset API', () => {
 *   beforeEach(async () => {
 *     // Clean test data
 *   });
 *
 *   describe('POST /api/auth/forgot-password', () => {
 *     it('should send code for valid customer', async () => {
 *       // Test implementation
 *     });
 *
 *     it('should not reveal if email exists', async () => {
 *       // Test implementation
 *     });
 *   });
 *
 *   describe('POST /api/auth/verify-reset-code', () => {
 *     it('should validate correct code', async () => {
 *       // Test implementation
 *     });
 *   });
 *
 *   describe('POST /api/auth/reset-password', () => {
 *     it('should reset password and auto-login', async () => {
 *       // Test implementation
 *     });
 *   });
 * });
 *
 * Run Tests:
 * cd apps/api
 * pnpm test auth.routes.password-reset.test.ts
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('Password Reset API', () => {
  it.todo('Full test suite will be implemented in Phase 22 (Security Testing & Hardening)');

  describe('POST /api/auth/forgot-password', () => {
    it.todo('should send code for valid active customer');
    it.todo('should not reveal if email exists (no enumeration)');
    it.todo('should not reveal if customer is inactive');
    it.todo('should not reveal if customer is guest');
    it.todo('should enforce rate limiting (3 requests/hour per email)');
    it.todo('should validate email format');
    it.todo('should sanitize email input');
    it.todo('should match email case-insensitively');
    it.todo('should invalidate previous codes');
    it.todo('should store IP address');
  });

  describe('POST /api/auth/verify-reset-code', () => {
    it.todo('should validate correct code');
    it.todo('should reject incorrect code');
    it.todo('should reject expired code');
    it.todo('should reject code with wrong type');
    it.todo('should enforce max attempts (3)');
    it.todo('should increment attempt counter');
    it.todo('should NOT mark code as used on success');
    it.todo('should enforce rate limiting');
  });

  describe('POST /api/auth/reset-password', () => {
    it.todo('should reset password with valid code');
    it.todo('should hash password with bcrypt');
    it.todo('should invalidate all password_reset codes');
    it.todo('should generate JWT token');
    it.todo('should set httpOnly auth cookie');
    it.todo('should return user object and token');
    it.todo('should reject invalid code');
    it.todo('should reject weak password');
    it.todo('should reject common password');
    it.todo('should reject inactive customer');
    it.todo('should reject guest customer');
    it.todo('should enforce password length (8-100)');
    it.todo('should validate password strength');
  });

  describe('Security', () => {
    it.todo('should prevent user enumeration');
    it.todo('should prevent timing attacks');
    it.todo('should rate limit by email');
    it.todo('should sanitize XSS');
    it.todo('should prevent SQL injection');
    it.todo('should enforce type isolation');
    it.todo('should prevent code reuse');
    it.todo('should enforce max attempts');
    it.todo('should enforce expiration');
    it.todo('should use httpOnly cookies');
  });

  describe('Edge Cases', () => {
    it.todo('should handle multiple concurrent reset requests');
    it.todo('should reject old code after new code created');
    it.todo('should reject email_verification code type');
    it.todo('should handle null passwordHash gracefully');
    it.todo('should handle email case variations');
    it.todo('should support unicode in passwords');
  });

  describe('Integration', () => {
    it.todo('should complete full flow: forgot → verify → reset → login');
    it.todo('should send email with correct code');
    it.todo('should update database correctly');
    it.todo('should log all operations');
  });
});
```

**Purpose**: Document all test scenarios for comprehensive testing in Phase 22

**Validation**:
- Test file compiles without errors
- All critical scenarios documented
- Follows Phase 13 test documentation pattern

**Commit Message**: `test(14-05): add password reset API test structure`

---

## Success Criteria

- [ ] 3 password reset endpoints implemented and functional
- [ ] All endpoints follow existing auth.routes.ts patterns
- [ ] Security best practices applied (no enumeration, rate limiting, validation)
- [ ] Zod schemas validate all inputs correctly
- [ ] Password hashing uses bcrypt with 12 rounds
- [ ] JWT tokens generated and cookies set correctly
- [ ] All verification codes invalidated after successful reset
- [ ] Test structure documented for Phase 22
- [ ] 5 atomic git commits created (1 per task)
- [ ] No TypeScript errors
- [ ] No breaking changes to existing auth endpoints

---

## Testing Checklist (Manual Validation)

**Endpoint 1: POST /api/auth/forgot-password**
- [ ] Valid email sends verification code
- [ ] Invalid email returns success (no enumeration)
- [ ] Rate limiting works (3/hour)
- [ ] Email format validation works
- [ ] Logs all attempts

**Endpoint 2: POST /api/auth/verify-reset-code**
- [ ] Valid code returns { valid: true }
- [ ] Invalid code returns 400 error
- [ ] Expired code returns 400 error
- [ ] Max attempts returns 429 error

**Endpoint 3: POST /api/auth/reset-password**
- [ ] Valid code + password resets successfully
- [ ] Auto-login works (token set)
- [ ] Weak password rejected
- [ ] Common password rejected
- [ ] All codes invalidated after reset

**Security**:
- [ ] No user enumeration possible
- [ ] Rate limiting enforced
- [ ] httpOnly cookies set
- [ ] Passwords hashed with bcrypt

---

## Dependencies

**Required Services** (already implemented):
- ✅ verificationCodeService (Phase 13)
- ✅ notificationService (Phase 13)
- ✅ mailerService (existing)

**Required Middleware** (already implemented):
- ✅ verificationLimiter (Phase 13)
- ✅ authLimiter (existing)
- ✅ xssSanitize (existing)
- ✅ validateBody (existing)

**Required Utilities** (already implemented):
- ✅ bcrypt (existing)
- ✅ generateToken (existing)
- ✅ getTokenExpiration (existing)
- ✅ sanitizeEmail (existing)
- ✅ isStrongPassword (existing)
- ✅ WEAK_PASSWORDS (existing)
- ✅ logger (existing)

**Database**:
- ✅ verification_codes table (Phase 13)
- ✅ customers table (existing)

---

## Phase Completion

After completing all 5 tasks:

1. **Verify all endpoints**:
   - Test manually with Postman/cURL
   - Verify database changes
   - Check logs

2. **Git commits**:
   - 5 atomic commits created (feat/test types)
   - Meaningful commit messages
   - All commits pushed

3. **Documentation**:
   - ASSUMPTIONS.md ✅
   - PLAN.md ✅
   - Test structure documented ✅

4. **Move to Phase 15**:
   - Phase 14 complete
   - Ready for frontend password reset flow
   - Backend API fully functional

---

## Notes

- **No database migrations needed** - Phase 13 already created verification_codes table
- **No new environment variables** - Reuse existing configuration
- **No new services** - Reuse Phase 13 infrastructure
- **Backend-only phase** - Frontend in Phase 15
- **Test implementation deferred** - Phase 22 will add comprehensive tests
