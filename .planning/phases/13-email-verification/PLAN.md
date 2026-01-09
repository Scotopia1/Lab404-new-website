# Phase 13: Email Verification Code System - Implementation Plan

**Phase:** 13 - Email Verification Code System
**Created:** 2026-01-09
**Status:** Ready to Execute
**Estimated Time:** 4-6 hours

---

## Goal

Build the foundation for verification codes used across password reset and email verification features.

---

## Success Criteria

- [ ] Database schema created with `verification_codes` table
- [ ] Code generation utility produces cryptographically secure 6-digit codes
- [ ] Verification code service handles create, validate, and invalidate operations
- [ ] Rate limiting middleware configured (3 attempts/hour)
- [ ] Cleanup cron job removes expired codes
- [ ] Email template for sending verification codes
- [ ] All unit and integration tests passing

---

## Tasks

### Task 1: Create Database Schema

**Estimated Time:** 30 minutes

**Description:**
Create the `verification_codes` table with Drizzle ORM schema and generate migration.

**Files to Create:**
- `packages/database/src/schema/verificationCodes.ts`

**Files to Modify:**
- `packages/database/src/schema/index.ts`

**Acceptance Criteria:**
- [ ] Schema file created with all required fields
- [ ] Enum created for code types (password_reset, email_verification, account_unlock)
- [ ] Indexes added for `email` and `expiresAt` fields
- [ ] TypeScript types exported
- [ ] Migration generated with `drizzle-kit generate`
- [ ] Migration applied to database

**Implementation:**

```typescript
// packages/database/src/schema/verificationCodes.ts

import { pgTable, uuid, varchar, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const verificationCodeTypeEnum = pgEnum('verification_code_type', [
  'password_reset',
  'email_verification',
  'account_unlock'
]);

export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Code details
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: verificationCodeTypeEnum('type').notNull(),

  // Security & tracking
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),

  // Expiration
  expiresAt: timestamp('expires_at').notNull(),

  // Status tracking
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),

  // IP tracking
  ipAddress: varchar('ip_address', { length: 45 }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Indexes
import { index } from 'drizzle-orm/pg-core';

export const verificationCodesEmailIdx = index('verification_codes_email_idx')
  .on(verificationCodes.email);

export const verificationCodesExpiresAtIdx = index('verification_codes_expires_at_idx')
  .on(verificationCodes.expiresAt);

// Types
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type VerificationCodeType = 'password_reset' | 'email_verification' | 'account_unlock';
```

**Commands:**
```bash
cd packages/database
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

### Task 2: Create Code Generation Utility

**Estimated Time:** 15 minutes

**Description:**
Add cryptographically secure 6-digit code generation to crypto utilities.

**Files to Modify:**
- `apps/api/src/utils/crypto.ts`

**Acceptance Criteria:**
- [ ] Function generates 6-digit numeric codes
- [ ] Uses `crypto.randomInt()` for cryptographic security
- [ ] Pads with leading zeros (e.g., 000123)
- [ ] No external dependencies required

**Implementation:**

```typescript
// apps/api/src/utils/crypto.ts

import crypto from 'crypto';

// ... existing functions ...

/**
 * Generate a cryptographically secure 6-digit verification code
 * @returns 6-digit string (000000-999999)
 */
export function generateVerificationCode(): string {
  // Generate random number between 0 and 999999
  const code = crypto.randomInt(0, 1000000);

  // Pad with leading zeros to ensure 6 digits
  return code.toString().padStart(6, '0');
}
```

**Testing:**
```typescript
// Manual test (run in Node.js REPL)
const { generateVerificationCode } = require('./crypto');

// Test format
for (let i = 0; i < 10; i++) {
  const code = generateVerificationCode();
  console.log(code); // Should always be 6 digits
}

// Test distribution (should be random)
const codes = new Set();
for (let i = 0; i < 1000; i++) {
  codes.add(generateVerificationCode());
}
console.log(`Generated ${codes.size} unique codes out of 1000`); // Should be close to 1000
```

---

### Task 3: Create Verification Code Service

**Estimated Time:** 2 hours

**Description:**
Implement service class with create, validate, and invalidate methods.

**Files to Create:**
- `apps/api/src/services/verification-code.service.ts`

**Files to Modify:**
- `apps/api/src/services/index.ts`

**Acceptance Criteria:**
- [ ] Service class created with singleton pattern
- [ ] `createCode()` method generates and stores codes
- [ ] `validateCode()` method validates with attempt tracking
- [ ] `invalidateCodes()` method marks codes as used
- [ ] Expiration logic enforced (15 minutes)
- [ ] Rate limiting enforced (3 attempts per code)
- [ ] Error handling with custom error types
- [ ] Logger integration

**Implementation:**

```typescript
// apps/api/src/services/verification-code.service.ts

import { getDb } from '@lab404/database';
import { verificationCodes, VerificationCodeType } from '@lab404/database';
import { eq, and, gte, desc, or, lte } from 'drizzle-orm';
import { generateVerificationCode } from '../utils/crypto';
import { BadRequestError, TooManyRequestsError } from '../utils/errors';
import { logger } from '../utils/logger';

interface CreateCodeOptions {
  email: string;
  type: VerificationCodeType;
  ipAddress?: string;
  expiryMinutes?: number;
}

interface ValidateCodeOptions {
  email: string;
  code: string;
  type: VerificationCodeType;
}

class VerificationCodeService {
  private readonly DEFAULT_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate and store a new verification code
   * Invalidates any existing unused codes for the same email/type
   */
  async createCode(options: CreateCodeOptions): Promise<string> {
    const { email, type, ipAddress, expiryMinutes = this.DEFAULT_EXPIRY_MINUTES } = options;
    const db = getDb();

    // Invalidate any existing unused codes for this email/type
    await this.invalidateCodes(email, type);

    // Generate 6-digit code
    const code = generateVerificationCode();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Store in database
    await db.insert(verificationCodes).values({
      email: email.toLowerCase(),
      code,
      type,
      expiresAt,
      ipAddress,
      maxAttempts: this.MAX_ATTEMPTS,
    });

    logger.info('Verification code created', { email, type, expiresAt });
    return code;
  }

  /**
   * Validate a verification code
   * Tracks attempts and enforces expiration
   */
  async validateCode(options: ValidateCodeOptions): Promise<boolean> {
    const { email, code, type } = options;
    const db = getDb();
    const now = new Date();

    // Find the most recent active code for this email/type
    const [record] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false),
          gte(verificationCodes.expiresAt, now)
        )
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (!record) {
      logger.warn('Verification code not found or expired', { email, type });
      throw new BadRequestError('Invalid or expired verification code');
    }

    // Check if max attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      logger.warn('Max verification attempts exceeded', { email, type, attempts: record.attempts });
      throw new TooManyRequestsError('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Increment attempts
    await db
      .update(verificationCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(verificationCodes.id, record.id));

    // Validate code
    if (record.code !== code) {
      logger.warn('Invalid verification code attempt', { email, type, attempts: record.attempts + 1 });
      throw new BadRequestError('Invalid verification code');
    }

    // Mark as used
    await db
      .update(verificationCodes)
      .set({
        isUsed: true,
        usedAt: now,
      })
      .where(eq(verificationCodes.id, record.id));

    logger.info('Verification code validated successfully', { email, type });
    return true;
  }

  /**
   * Invalidate all unused codes for a specific email/type
   */
  async invalidateCodes(email: string, type: VerificationCodeType): Promise<void> {
    const db = getDb();
    const now = new Date();

    const result = await db
      .update(verificationCodes)
      .set({ isUsed: true, usedAt: now })
      .where(
        and(
          eq(verificationCodes.email, email.toLowerCase()),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false)
        )
      )
      .returning({ id: verificationCodes.id });

    if (result.length > 0) {
      logger.info('Invalidated existing verification codes', {
        email,
        type,
        count: result.length
      });
    }
  }

  /**
   * Cleanup expired and used verification codes
   * Called by cron job
   */
  async cleanupExpiredCodes(): Promise<number> {
    const db = getDb();
    const now = new Date();

    // Delete codes that are:
    // 1. Expired for more than 24 hours, OR
    // 2. Used and usedAt is more than 24 hours ago
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(verificationCodes)
      .where(
        or(
          lte(verificationCodes.expiresAt, cutoffDate),
          and(
            eq(verificationCodes.isUsed, true),
            lte(verificationCodes.usedAt, cutoffDate)
          )
        )
      )
      .returning({ id: verificationCodes.id });

    logger.info('Verification codes cleanup completed', {
      deletedCount: deleted.length
    });

    return deleted.length;
  }
}

export const verificationCodeService = new VerificationCodeService();
```

**Export from services/index.ts:**
```typescript
export { verificationCodeService } from './verification-code.service';
```

---

### Task 4: Create Rate Limiting Middleware

**Estimated Time:** 15 minutes

**Description:**
Add verification-specific rate limiter following existing patterns.

**Files to Modify:**
- `apps/api/src/middleware/rateLimiter.ts`

**Acceptance Criteria:**
- [ ] Middleware created for verification endpoints
- [ ] 3 requests per hour limit enforced
- [ ] Rate limit by email from request body
- [ ] Fallback to IP if email not provided
- [ ] Clear error message returned

**Implementation:**

```typescript
// apps/api/src/middleware/rateLimiter.ts

// ... existing imports and limiters ...

/**
 * Rate limiter for verification code generation
 * 3 attempts per hour per email address
 */
export const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour

  // Rate limit by email address from request body, fallback to IP
  keyGenerator: (req) => {
    const email = req.body?.email;
    return email ? email.toLowerCase() : req.ip;
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res) => {
    sendError(res, 429, 'TOO_MANY_REQUESTS',
      'Too many verification code requests. Please try again in 1 hour.');
  },
});
```

**Export from middleware/index.ts:**
```typescript
export { verificationLimiter } from './rateLimiter';
```

---

### Task 5: Add Cleanup Cron Endpoint

**Estimated Time:** 30 minutes

**Description:**
Add cron endpoint to remove expired verification codes.

**Files to Modify:**
- `apps/api/src/routes/cron.routes.ts`

**Acceptance Criteria:**
- [ ] Endpoint created at `POST /api/cron/cleanup-verification-codes`
- [ ] Protected by `verifyCronSecret` middleware
- [ ] Calls `verificationCodeService.cleanupExpiredCodes()`
- [ ] Returns deleted count
- [ ] Error handling implemented

**Implementation:**

```typescript
// apps/api/src/routes/cron.routes.ts

// ... existing imports ...
import { verificationCodeService } from '../services';

// ... existing cron routes ...

/**
 * POST /api/cron/cleanup-verification-codes
 * Remove expired and used verification codes older than 24 hours
 */
cronRoutes.post('/cleanup-verification-codes', verifyCronSecret, async (req, res, next) => {
  try {
    const startTime = Date.now();

    const deletedCount = await verificationCodeService.cleanupExpiredCodes();

    const duration = Date.now() - startTime;

    logger.info('Verification codes cleanup cron completed', {
      deletedCount,
      durationMs: duration
    });

    sendSuccess(res, {
      message: 'Verification codes cleanup completed',
      deletedCount,
      durationMs: duration,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Verification codes cleanup cron failed', { error });
    next(error);
  }
});
```

**Cron Schedule (Add to vercel.json or external cron service):**
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-verification-codes",
    "schedule": "0 */6 * * *"
  }]
}
```

---

### Task 6: Create Email Template

**Estimated Time:** 30 minutes

**Description:**
Add email template for sending verification codes to customers.

**Files to Modify:**
- `apps/api/src/services/notification.service.ts`

**Acceptance Criteria:**
- [ ] Method added to NotificationService
- [ ] HTML template uses existing `wrapCustomerTemplate()`
- [ ] Large, centered code display (32px font)
- [ ] Red warning text for expiry time
- [ ] Subject line varies by code type

**Implementation:**

```typescript
// apps/api/src/services/notification.service.ts

// Add to NotificationService class

interface VerificationCodeEmailData {
  email: string;
  code: string;
  type: 'password_reset' | 'email_verification' | 'account_unlock';
  expiryMinutes: number;
}

/**
 * Send verification code email
 */
async sendVerificationCode(data: VerificationCodeEmailData): Promise<boolean> {
  const { email, code, type, expiryMinutes } = data;

  // Subject based on type
  const subjects = {
    password_reset: 'Password Reset Verification Code',
    email_verification: 'Email Verification Code',
    account_unlock: 'Account Unlock Verification Code',
  };
  const subject = subjects[type];

  // Title based on type
  const titles = {
    password_reset: 'Reset Your Password',
    email_verification: 'Verify Your Email',
    account_unlock: 'Unlock Your Account',
  };
  const title = titles[type];

  const html = emailTemplatesService.wrapCustomerTemplate(`
    <h2 style="color: #1f2937; margin-bottom: 24px;">${title}</h2>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
      Your verification code is:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background: #f3f4f6; padding: 20px 40px; border-radius: 8px; border: 2px dashed #d1d5db;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
          ${code}
        </span>
      </div>
    </div>

    <p style="color: #dc2626; font-weight: bold; font-size: 14px; margin: 20px 0;">
      ⚠️ This code will expire in ${expiryMinutes} minutes.
    </p>

    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
      If you didn't request this code, please ignore this email or contact our support team if you have concerns.
    </p>
  `, 'Lab404 Electronics');

  logger.info('Sending verification code email', { email, type });

  return mailerService.sendEmail({
    to: email,
    subject,
    html,
  });
}
```

---

### Task 7: Integration Testing

**Estimated Time:** 1 hour

**Description:**
Create integration tests for the verification code service.

**Files to Create:**
- `apps/api/src/services/__tests__/verification-code.service.test.ts`

**Acceptance Criteria:**
- [ ] Test code generation (format, uniqueness)
- [ ] Test code creation and storage
- [ ] Test code validation (success case)
- [ ] Test expiration enforcement
- [ ] Test max attempts enforcement
- [ ] Test invalidation logic
- [ ] Test cleanup service

**Implementation:**

```typescript
// apps/api/src/services/__tests__/verification-code.service.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { verificationCodeService } from '../verification-code.service';
import { generateVerificationCode } from '../../utils/crypto';
import { getDb, verificationCodes, eq } from '@lab404/database';

describe('VerificationCodeService', () => {
  const testEmail = 'test@example.com';
  const db = getDb();

  // Clean up before each test
  beforeEach(async () => {
    await db.delete(verificationCodes).where(eq(verificationCodes.email, testEmail));
  });

  describe('generateVerificationCode', () => {
    it('should generate 6-digit code', () => {
      const code = generateVerificationCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should include leading zeros', () => {
      // Run multiple times to increase chance of getting a low number
      const codes = Array.from({ length: 100 }, () => generateVerificationCode());
      const hasLeadingZero = codes.some(code => code.startsWith('0'));
      expect(hasLeadingZero).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 1000; i++) {
        codes.add(generateVerificationCode());
      }
      // Should have high uniqueness (999+ out of 1000)
      expect(codes.size).toBeGreaterThan(990);
    });
  });

  describe('createCode', () => {
    it('should create and return a code', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should store code in database', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      expect(record).toBeDefined();
      expect(record.code).toBe(code);
      expect(record.type).toBe('password_reset');
      expect(record.isUsed).toBe(false);
      expect(record.attempts).toBe(0);
    });

    it('should set expiration 15 minutes in future', async () => {
      const beforeCreate = new Date();
      await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      const expectedExpiry = new Date(beforeCreate.getTime() + 15 * 60 * 1000);
      const actualExpiry = new Date(record.expiresAt);

      // Allow 5 second tolerance
      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(5000);
    });

    it('should invalidate previous codes when creating new one', async () => {
      // Create first code
      await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      // Create second code
      await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      // Check that first code is marked as used
      const records = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail))
        .orderBy(verificationCodes.createdAt);

      expect(records).toHaveLength(2);
      expect(records[0].isUsed).toBe(true); // First code invalidated
      expect(records[1].isUsed).toBe(false); // Second code active
    });
  });

  describe('validateCode', () => {
    it('should validate correct code', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      const result = await verificationCodeService.validateCode({
        email: testEmail,
        code,
        type: 'password_reset',
      });

      expect(result).toBe(true);

      // Check code is marked as used
      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      expect(record.isUsed).toBe(true);
      expect(record.usedAt).toBeDefined();
    });

    it('should reject incorrect code', async () => {
      await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      await expect(
        verificationCodeService.validateCode({
          email: testEmail,
          code: '000000',
          type: 'password_reset',
        })
      ).rejects.toThrow('Invalid verification code');
    });

    it('should track failed attempts', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      // First wrong attempt
      await expect(
        verificationCodeService.validateCode({
          email: testEmail,
          code: '000000',
          type: 'password_reset',
        })
      ).rejects.toThrow();

      // Check attempts incremented
      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      expect(record.attempts).toBe(1);
    });

    it('should enforce max attempts', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await verificationCodeService.validateCode({
            email: testEmail,
            code: '000000',
            type: 'password_reset',
          });
        } catch (e) {
          // Expected to fail
        }
      }

      // 4th attempt should hit max attempts error
      await expect(
        verificationCodeService.validateCode({
          email: testEmail,
          code,
          type: 'password_reset',
        })
      ).rejects.toThrow('Maximum verification attempts exceeded');
    });

    it('should reject expired code', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
        expiryMinutes: -1, // Already expired
      });

      await expect(
        verificationCodeService.validateCode({
          email: testEmail,
          code,
          type: 'password_reset',
        })
      ).rejects.toThrow('Invalid or expired verification code');
    });

    it('should reject mismatched type', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
      });

      await expect(
        verificationCodeService.validateCode({
          email: testEmail,
          code,
          type: 'email_verification', // Wrong type
        })
      ).rejects.toThrow('Invalid or expired verification code');
    });
  });

  describe('cleanupExpiredCodes', () => {
    it('should delete expired codes older than 24 hours', async () => {
      // Create expired code
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
        expiryMinutes: -1500, // 25 hours ago
      });

      const deletedCount = await verificationCodeService.cleanupExpiredCodes();

      expect(deletedCount).toBeGreaterThan(0);

      // Verify code was deleted
      const records = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      expect(records).toHaveLength(0);
    });

    it('should not delete recent expired codes', async () => {
      const code = await verificationCodeService.createCode({
        email: testEmail,
        type: 'password_reset',
        expiryMinutes: -10, // 10 minutes ago (within 24 hour window)
      });

      const deletedCount = await verificationCodeService.cleanupExpiredCodes();

      // This code should NOT be deleted
      const records = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.email, testEmail));

      expect(records).toHaveLength(1);
    });
  });
});
```

**Run Tests:**
```bash
cd apps/api
pnpm test verification-code.service.test.ts
```

---

## Implementation Order

1. **Task 1**: Database Schema (30 min) - Foundation
2. **Task 2**: Code Generation (15 min) - Utility
3. **Task 3**: Verification Service (2 hrs) - Core logic
4. **Task 4**: Rate Limiting (15 min) - Security
5. **Task 5**: Cleanup Cron (30 min) - Maintenance
6. **Task 6**: Email Template (30 min) - User communication
7. **Task 7**: Testing (1 hr) - Quality assurance

**Total Time**: 4-5 hours

---

## Dependencies

All required packages are already installed:
- ✅ `crypto` (Node.js built-in)
- ✅ `drizzle-orm` (0.36.0)
- ✅ `express-rate-limit` (7.4.0)
- ✅ `nodemailer` (6.10.1)

**No new dependencies needed.**

---

## Testing Strategy

### Unit Tests
- Code generation format and uniqueness
- Service method logic

### Integration Tests
- Database operations
- Expiration logic
- Rate limiting
- Cleanup service

### Manual Testing
- Email rendering and delivery
- End-to-end flow (create → send → validate)
- Rate limiting behavior

---

## Rollout Plan

1. **Apply Database Migration**
   ```bash
   cd packages/database
   pnpm drizzle-kit push
   ```

2. **Deploy Code**
   - Service layer (no API endpoints yet, safe to deploy)
   - Phase 14 will create API endpoints

3. **Configure Cron Job**
   - Add to Vercel Cron or external cron service
   - Schedule: Every 6 hours

4. **Monitor**
   - Check logs for code creation events
   - Monitor cleanup job execution
   - Track email delivery rates

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Email delivery failures | Log failures, provide support contact |
| Time zone issues | Use UTC for all timestamps |
| Rate limit false positives | 3/hour is generous, clear error messages |
| Code collisions | Acceptable (1 in 1M), DB unique constraint |

---

## Success Metrics

- [ ] All tests passing (100%)
- [ ] Migration applied successfully
- [ ] Email template renders correctly
- [ ] Cleanup cron job executes without errors
- [ ] No lint or TypeScript errors
- [ ] Documentation complete

---

## Next Phase

**Phase 14**: Password Reset Backend API
- Will use this verification code service
- Will create 3 API endpoints:
  - `POST /api/auth/forgot-password` (request code)
  - `POST /api/auth/verify-reset-code` (validate code)
  - `POST /api/auth/reset-password` (reset with valid code)

---

*Plan Created: 2026-01-09*
*Ready to Execute: Yes*
