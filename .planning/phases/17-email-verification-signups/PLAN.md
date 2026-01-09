# Phase 17: Email Verification for New Signups - Implementation Plan

## Overview
Add email verification requirement for new customer registrations to prevent spam accounts and confirm email ownership.

**Phase Goals**:
- ✅ Database schema with email verification tracking
- ✅ Verification email templates
- ✅ API endpoints for verify and resend
- ✅ Registration flow modification (no auto-login)
- ✅ Login flow modification (block unverified)
- ✅ Frontend verification form and pages

**Dependencies**: Phase 13-16 complete ✅

**Estimated Tasks**: 15 tasks

---

## Task 1: Database Migration - Add Email Verification Columns

**Objective**: Add `emailVerified` and `emailVerifiedAt` columns to customers table

**Files to Create**:
- `packages/database/drizzle/0003_add_email_verification.sql`

**Implementation Steps**:

1. **Create migration SQL file**:

```sql
-- Migration: Add email verification columns to customers table
-- Created: 2026-01-09

-- Add email verification columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Create index for faster lookups by verification status
CREATE INDEX IF NOT EXISTS customers_email_verified_idx ON customers(email_verified);

-- Comment columns for documentation
COMMENT ON COLUMN customers.email_verified IS 'Whether the customer has verified their email address';
COMMENT ON COLUMN customers.email_verified_at IS 'Timestamp when the email was verified';
```

2. **Apply migration using Node.js script** (like Phase 13):

```javascript
// apply-verification-migration.js
require('dotenv').config({ path: '../../.env' });
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function applyMigration() {
  const migration = fs.readFileSync('./drizzle/0003_add_email_verification.sql', 'utf-8');
  await db.execute(migration);
  console.log('Migration applied successfully');
  await sql.end();
}

applyMigration();
```

3. **Run migration**:
```bash
cd packages/database
node apply-verification-migration.js
rm apply-verification-migration.js
```

**Verification**:
- Connect to database and verify columns exist
- Verify index created
- Check default values (emailVerified = false)

**Commit Message**: `feat(17-01): add email verification columns to customers table`

---

## Task 2: Database Migration - Verify Existing Users

**Objective**: Mark all existing customers as email-verified to avoid disruption

**Files to Create**:
- `packages/database/scripts/verify-existing-users.js`

**Implementation Steps**:

1. **Create migration script**:

```javascript
// packages/database/scripts/verify-existing-users.js
require('dotenv').config({ path: '../../../.env' });
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq, isNull } = require('drizzle-orm');
const postgres = require('postgres');
const { customers } = require('../src/schema/customers');

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql, { schema: { customers } });

async function verifyExistingUsers() {
  console.log('Verifying existing users...');

  // Update all existing non-guest customers without emailVerified set
  const result = await db
    .update(customers)
    .set({
      emailVerified: true,
      emailVerifiedAt: db.$now(),  // Use current timestamp
    })
    .where(
      and(
        eq(customers.isGuest, false),
        or(
          isNull(customers.emailVerified),
          eq(customers.emailVerified, false)
        )
      )
    );

  console.log(`Updated ${result.rowCount} existing users as verified`);

  await sql.end();
}

verifyExistingUsers().catch(console.error);
```

2. **Run migration script**:
```bash
cd packages/database
node scripts/verify-existing-users.js
```

3. **Verify results**:
```sql
SELECT COUNT(*) FROM customers WHERE email_verified = TRUE AND is_guest = FALSE;
SELECT COUNT(*) FROM customers WHERE email_verified = FALSE AND is_guest = FALSE;
```

**Expected Result**: All existing non-guest customers should have `emailVerified = true`

**Commit Message**: `feat(17-02): auto-verify existing customer accounts`

---

## Task 3: Update Database Schema TypeScript

**Objective**: Add email verification columns to Drizzle schema

**Files to Modify**:
- `packages/database/src/schema/customers.ts`

**Implementation Steps**:

1. **Add columns to schema** (after `isGuest` field, around line 25):

```typescript
// Email verification
emailVerified: boolean('email_verified').default(false).notNull(),
emailVerifiedAt: timestamp('email_verified_at'),
```

2. **Update schema export types** (if needed):

```typescript
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
```

3. **Rebuild database package**:
```bash
cd packages/database
pnpm build
```

**Verification**:
- TypeScript compiles without errors
- Types include `emailVerified` and `emailVerifiedAt`

**Commit Message**: `feat(17-03): add email verification to customer schema`

---

## Task 4: Add Email Verification Email Method

**Objective**: Create `sendEmailVerification()` method in NotificationService

**Files to Modify**:
- `apps/api/src/services/notification.service.ts`

**Implementation Steps**:

1. **Add method after `sendPasswordChangedConfirmation()` method** (around line 612):

```typescript
/**
 * Send email verification code for new account registration
 * Welcomes user and provides 6-digit verification code
 */
async sendEmailVerification(data: {
  email: string;
  firstName: string | null;
  code: string;
  expiryMinutes: number;
}): Promise<boolean> {
  const { email, firstName, code, expiryMinutes } = data;
  const companyName = process.env.COMPANY_NAME || 'Lab404 Electronics';

  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';

  const html = this.wrapCustomerTemplate(`
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">
        ✉️
      </div>
    </div>

    <h2 style="color: #1f2937; margin-bottom: 24px; text-align: center;">
      Welcome to ${companyName}!
    </h2>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
      ${greeting}
    </p>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
      Thank you for creating an account with us. To complete your registration and activate your account, please verify your email address using the code below.
    </p>

    <div style="background: #eff6ff; border: 2px solid #2563eb; padding: 24px; border-radius: 8px; margin: 30px 0; text-align: center;">
      <p style="color: #1e40af; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        Your Verification Code
      </p>
      <p style="color: #1e3a8a; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
        ${code}
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-bottom: 20px; text-align: center;">
      This code will expire in <strong>${expiryMinutes} minutes</strong>.
    </p>

    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px;">
        <strong>Didn't create an account?</strong><br>
        If you didn't request this verification code, you can safely ignore this email. Your email address will not be used without verification.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
      Need help? Contact our support team at <a href="mailto:contact@lab404electronics.com" style="color: #2563eb; text-decoration: none;">contact@lab404electronics.com</a>
    </p>
  `, companyName);

  logger.info('Sending email verification code', { email });

  return mailerService.sendEmail({
    to: email,
    subject: `Verify Your Email Address - ${companyName}`,
    html,
  });
}
```

**Key Features**:
- Blue envelope icon (welcoming)
- Large centered 6-digit code display
- Expiry time notice
- "Didn't create account" security note
- Support contact link
- Professional responsive design

**Commit Message**: `feat(17-04): add email verification email method`

---

## Task 5: Add Verify Email Endpoint

**Objective**: Create POST /api/auth/verify-email endpoint

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add Zod schema** (at top of file with other schemas):

```typescript
const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only digits'),
});
```

2. **Add endpoint after reset-password endpoint** (around line ~730):

```typescript
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
 *   expiresAt: number
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, code } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

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
        id: customer.id,
        email: customer.email,
        emailVerified: true,
        isAdmin: customer.isAdmin,
      });

      const expiresAt = Date.now() + JWT_EXPIRY;

      // Set httpOnly cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: JWT_EXPIRY,
      });

      const user = {
        id: customer.id,
        email: customer.email,
        emailVerified: true,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        isAdmin: customer.isAdmin,
      };

      sendSuccess(res, {
        message: 'Email verified successfully',
        user,
        token,
        expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }
);
```

**Security Features**:
- Rate limited (3 requests/hour)
- XSS sanitization
- No user enumeration (generic error messages)
- Auto-login after verification
- Code invalidation after use

**Commit Message**: `feat(17-05): add verify email endpoint with auto-login`

---

## Task 6: Add Resend Verification Endpoint

**Objective**: Create POST /api/auth/resend-verification endpoint

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Add Zod schema** (with other schemas):

```typescript
const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
});
```

2. **Add endpoint after verify-email endpoint**:

```typescript
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

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
```

**Security Features**:
- Rate limited (3 requests/hour)
- No user enumeration
- Invalidates previous codes
- Non-blocking email send

**Commit Message**: `feat(17-06): add resend verification endpoint`

---

## Task 7: Modify Registration Endpoint

**Objective**: Update registration to NOT auto-login, send verification email instead

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Find register endpoint** (line ~123-225)

2. **Modify the response section** (after customer creation, around line ~200):

**BEFORE**:
```typescript
// Generate JWT token
const token = generateToken({
  id: newCustomer.id,
  email: newCustomer.email,
  isAdmin: false,
});

// Set httpOnly cookie
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: JWT_EXPIRY,
});

sendSuccess(res, {
  message: 'Registration successful',
  user: { ... },
  token,
  expiresAt,
});
```

**AFTER**:
```typescript
// Generate verification code
const code = await verificationCodeService.createCode({
  email: newCustomer.email,
  type: 'email_verification',
  ipAddress: req.ip,
  expiryMinutes: 15,
});

// Send verification email (non-blocking)
const emailSent = await notificationService.sendEmailVerification({
  email: newCustomer.email,
  firstName: newCustomer.firstName,
  code,
  expiryMinutes: 15,
});

if (!emailSent) {
  logger.error('Failed to send verification email', {
    email: newCustomer.email,
    customerId: newCustomer.id,
  });
}

logger.info('Customer registered, verification email sent', {
  customerId: newCustomer.id,
  email: newCustomer.email,
});

// NO TOKEN, NO COOKIE - User must verify email first
sendSuccess(res, {
  message: 'Registration successful. Please check your email to verify your account.',
  user: {
    id: newCustomer.id,
    email: newCustomer.email,
    emailVerified: false,  // NEW: Include verification status
    firstName: newCustomer.firstName,
    lastName: newCustomer.lastName,
  },
});
```

**Key Changes**:
- Remove token generation
- Remove cookie setting
- Add verification code creation
- Add verification email sending
- Update response message
- Include `emailVerified: false` in user object

**Commit Message**: `feat(17-07): modify registration to require email verification`

---

## Task 8: Modify Login Endpoint

**Objective**: Block login for unverified users, show verification prompt

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Find login endpoint** (line ~227-315)

2. **Add verification check after password validation** (around line ~280):

```typescript
// Validate password
const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);

if (!isPasswordValid) {
  logger.warn('Invalid login attempt', { email: customer.email, ip: req.ip });
  return sendError(res, 'Invalid email or password.', 401);
}

// NEW: Check email verification status
if (!customer.emailVerified) {
  logger.info('Login blocked: Email not verified', {
    email: customer.email,
    customerId: customer.id,
  });

  return sendError(
    res,
    'Email not verified. Please check your inbox for the verification code.',
    403,  // 403 Forbidden (not 401 Unauthorized)
    {
      code: 'EMAIL_NOT_VERIFIED',
      email: customer.email,  // Allow resend from login page
    }
  );
}

// Continue with normal login flow...
const token = generateToken({...});
```

**Key Changes**:
- Add `emailVerified` check after password validation
- Use 403 status (Forbidden) not 401 (Unauthorized)
- Include special error code `EMAIL_NOT_VERIFIED`
- Include email in response (for resend functionality)
- Log blocked login attempts

**Commit Message**: `feat(17-08): block login for unverified email addresses`

---

## Task 9: Update JWT Token Generation

**Objective**: Include `emailVerified` in JWT payload

**Files to Modify**:
- `apps/api/src/utils/jwt.ts`

**Implementation Steps**:

1. **Update TokenPayload interface** (around line 5):

```typescript
interface TokenPayload {
  id: string;
  email: string;
  emailVerified: boolean;  // NEW
  isAdmin: boolean;
}
```

2. **Update generateToken function signature** (around line 12):

```typescript
export function generateToken(data: {
  id: string;
  email: string;
  emailVerified: boolean;  // NEW
  isAdmin: boolean;
}): string {
  const payload: TokenPayload = {
    id: data.id,
    email: data.email,
    emailVerified: data.emailVerified,  // NEW
    isAdmin: data.isAdmin,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY / 1000 });
}
```

3. **Update all generateToken calls** in auth.routes.ts:

**Login endpoint** (line ~290):
```typescript
const token = generateToken({
  id: customer.id,
  email: customer.email,
  emailVerified: customer.emailVerified,  // NEW
  isAdmin: customer.isAdmin,
});
```

**Verify email endpoint** (Task 5 already includes this)

**Reset password endpoint** (line ~685):
```typescript
const token = generateToken({
  id: customer.id,
  email: customer.email,
  emailVerified: customer.emailVerified,  // NEW
  isAdmin: customer.isAdmin,
});
```

**Commit Message**: `feat(17-09): include emailVerified in JWT payload`

---

## Task 10: Frontend - Email Verification Validation Schemas

**Objective**: Create Zod validation schemas for verification endpoints

**Files to Create**:
- `apps/lab404-website/src/lib/validations/email-verification.ts`

**Implementation Steps**:

1. **Create validation schemas file**:

```typescript
import { z } from 'zod';

/**
 * Schema for verifying email with code
 * Used in: /verify-email page
 */
export const verifyEmailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

/**
 * Schema for resending verification email
 * Used in: /verify-email page, login page
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long'),
});

// Export types
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;
```

**Commit Message**: `feat(17-10): add email verification validation schemas`

---

## Task 11: Frontend - Auth Store Methods

**Objective**: Add email verification methods to Zustand auth store

**Files to Modify**:
- `apps/lab404-website/src/stores/useAuthStore.ts`

**Implementation Steps**:

1. **Update AuthState interface** (around line 15):

```typescript
interface AuthState {
  // ... existing fields
  verificationPending: boolean;
  pendingEmail: string | null;

  // ... existing methods
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  setVerificationPending: (email: string | null) => void;
}
```

2. **Add state fields** (in create function, around line 25):

```typescript
verificationPending: false,
pendingEmail: null,
```

3. **Add methods** (after resetPassword method):

```typescript
/**
 * Verify email address with code
 * Auto-logs in user after successful verification
 */
verifyEmail: async (email: string, code: string) => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    // Update store with verified user
    set({
      user: data.data.user,
      isAuthenticated: true,
      verificationPending: false,
      pendingEmail: null,
      isLoading: false,
    });

    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    set({ error: message, isLoading: false });
    throw error;
  }
},

/**
 * Resend verification email
 */
resendVerificationEmail: async (email: string) => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend verification email');
    }

    set({ isLoading: false });
    return data.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend';
    set({ error: message, isLoading: false });
    throw error;
  }
},

/**
 * Set verification pending state
 */
setVerificationPending: (email: string | null) => {
  set({
    verificationPending: !!email,
    pendingEmail: email,
  });
},
```

**Commit Message**: `feat(17-11): add email verification methods to auth store`

---

## Task 12: Frontend - Email Verification Form Component

**Objective**: Create verification form component with code input

**Files to Create**:
- `apps/lab404-website/src/components/forms/email-verification-form.tsx`

**Implementation Steps**:

1. **Create form component** (300+ lines):

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { verifyEmailSchema, type VerifyEmailFormData } from '@/lib/validations/email-verification';

export function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { verifyEmail, resendVerificationEmail, isLoading } = useAuthStore();

  // Get email from URL params or store
  const emailParam = searchParams.get('email');
  const [email] = useState(emailParam || '');
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: email,
      code: '',
    },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      await verifyEmail(data.email, data.code);

      toast({
        title: 'Email Verified!',
        description: 'Your account has been activated successfully.',
      });

      // Redirect to account page
      router.push('/account');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid or expired code',
      });
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendVerificationEmail(email);

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });

      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: 'Please try again later.',
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden email field */}
        <input type="hidden" {...register('email')} />

        {/* Verification Code Input */}
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            style={{ fontSize: '24px' }}  // Prevent iOS zoom
            {...register('code')}
            aria-invalid={errors.code ? 'true' : 'false'}
            onPaste={(e) => {
              // Allow pasting codes
              const paste = e.clipboardData.getData('text');
              const digits = paste.replace(/\D/g, '').slice(0, 6);
              if (digits) {
                setValue('code', digits);
                e.preventDefault();
              }
            }}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading}
          style={{ minHeight: '44px' }}  // Touch-friendly
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </form>

      {/* Resend Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResendCode}
          disabled={isLoading || resendCooldown > 0}
          className="w-full sm:w-auto"
          style={{ minHeight: '44px' }}  // Touch-friendly
        >
          {resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Code
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Code expires in 15 minutes. Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}
```

**Key Features**:
- Email pre-filled from URL params
- Large centered code input
- Paste support for codes
- Resend button with 60-second cooldown
- Mobile-optimized (24px font, 44px buttons)
- Loading states
- Toast notifications
- Auto-redirect after verification

**Commit Message**: `feat(17-12): create email verification form component`

---

## Task 13: Frontend - Verification Page

**Objective**: Create /verify-email page

**Files to Create**:
- `apps/lab404-website/src/app/(auth)/verify-email/page.tsx`

**Implementation Steps**:

1. **Create page component**:

```typescript
import { Suspense } from 'react';
import { Metadata } from 'next';
import { EmailVerificationForm } from '@/components/forms/email-verification-form';

export const metadata: Metadata = {
  title: 'Verify Email | Lab404 Electronics',
  description: 'Verify your email address to activate your account',
};

export default function VerifyEmailPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <EmailVerificationForm />
      </Suspense>
    </div>
  );
}
```

**Key Features**:
- Centered layout
- Suspense boundary for search params
- Proper metadata
- Consistent with other auth pages

**Commit Message**: `feat(17-13): create email verification page`

---

## Task 14: Frontend - Modify Registration Page

**Objective**: Update registration success to show verification message

**Files to Modify**:
- `apps/lab404-website/src/app/(auth)/register/page.tsx`
- `apps/lab404-website/src/components/forms/register-form.tsx` (if separate component)

**Implementation Steps**:

1. **Find registration form submit handler**

2. **Update success handling** (after successful registration):

**BEFORE**:
```typescript
await register(data);
toast({ title: 'Registration successful' });
router.push('/account');  // Auto-redirect
```

**AFTER**:
```typescript
const result = await register(data);

// Store email for verification page
useAuthStore.getState().setVerificationPending(data.email);

toast({
  title: 'Registration Successful!',
  description: 'Please check your email to verify your account.',
});

// Redirect to verification page with email
router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
```

**Key Changes**:
- Set verification pending state
- Update toast message
- Redirect to /verify-email instead of /account
- Pass email in URL params

**Commit Message**: `feat(17-14): update registration to redirect to email verification`

---

## Task 15: Frontend - Modify Login Page

**Objective**: Handle EMAIL_NOT_VERIFIED error and show resend option

**Files to Modify**:
- `apps/lab404-website/src/app/(auth)/login/page.tsx`
- `apps/lab404-website/src/components/forms/login-form.tsx` (if separate component)

**Implementation Steps**:

1. **Find login form submit handler**

2. **Add error handling for unverified email**:

```typescript
try {
  await login(data.email, data.password);
  router.push('/account');
} catch (error: any) {
  // Check if error is EMAIL_NOT_VERIFIED
  if (error?.code === 'EMAIL_NOT_VERIFIED' && error?.email) {
    // Set verification pending
    useAuthStore.getState().setVerificationPending(error.email);

    toast({
      title: 'Email Not Verified',
      description: 'Please verify your email address to continue.',
      variant: 'destructive',
    });

    // Redirect to verification page
    router.push(`/verify-email?email=${encodeURIComponent(error.email)}`);
  } else {
    toast({
      title: 'Login Failed',
      description: error.message || 'Invalid email or password',
      variant: 'destructive',
    });
  }
}
```

3. **Update auth store login method** to throw detailed error:

In `apps/lab404-website/src/stores/useAuthStore.ts`:

```typescript
login: async (email: string, password: string) => {
  // ... existing code

  const data = await response.json();

  if (!response.ok) {
    // Include error code and additional data in thrown error
    const error: any = new Error(data.error || 'Login failed');
    error.code = data.data?.code;
    error.email = data.data?.email;
    throw error;
  }

  // ... rest of login logic
},
```

**Commit Message**: `feat(17-15): handle unverified email in login flow`

---

## Task 16: Create Test Structure Documentation

**Objective**: Document comprehensive test scenarios for Phase 22 implementation

**Files to Create**:
- `apps/api/src/routes/__tests__/auth.email-verification.test.ts`
- `apps/api/src/services/__tests__/notification.service.email-verification.test.ts`
- `apps/lab404-website/src/components/forms/__tests__/email-verification-form.test.tsx`

**Implementation Steps**:

1. **Create backend test structure** (apps/api/src/routes/__tests__/auth.email-verification.test.ts):

```typescript
/**
 * Email Verification API Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22 (Security Testing & Hardening).
 * This file documents the test scenarios that should be covered.
 *
 * Test Coverage Required:
 *
 * 1. POST /auth/verify-email Tests:
 *    - Successfully verifies email with valid code
 *    - Returns 400 for invalid code
 *    - Returns 400 for expired code
 *    - Returns 400 for already verified email
 *    - Updates emailVerified and emailVerifiedAt in database
 *    - Invalidates verification codes after successful verification
 *    - Generates JWT token with emailVerified: true
 *    - Sets auth_token httpOnly cookie
 *    - Rate limits to 3 requests per hour
 *    - Handles guest accounts correctly (should fail)
 *    - XSS protection on email input
 *
 * 2. POST /auth/resend-verification Tests:
 *    - Always returns success (no user enumeration)
 *    - Sends email for valid unverified account
 *    - Does NOT send email for verified account
 *    - Does NOT send email for non-existent account
 *    - Does NOT send email for guest account
 *    - Invalidates previous codes before creating new one
 *    - Rate limits to 3 requests per hour
 *    - Non-blocking email send (logs failure)
 *    - XSS protection on email input
 *
 * 3. POST /auth/register Tests (Modified):
 *    - Creates customer with emailVerified = false
 *    - Sends verification email after registration
 *    - Does NOT return JWT token
 *    - Does NOT set auth_token cookie
 *    - Returns user object with emailVerified: false
 *    - Logs email send failures (non-blocking)
 *
 * 4. POST /auth/login Tests (Modified):
 *    - Blocks login for unverified email
 *    - Returns 403 with EMAIL_NOT_VERIFIED code
 *    - Includes email in error response
 *    - Allows login for verified email (normal flow)
 *    - Logs blocked login attempts
 *
 * 5. JWT Token Tests:
 *    - Token includes emailVerified field
 *    - Token verification handles emailVerified
 *    - Token backward compatible (optional field)
 *
 * 6. Database Migration Tests:
 *    - Existing users marked as verified
 *    - New users default to unverified
 *    - Columns have correct constraints
 *    - Index on emailVerified exists
 *
 * 7. Integration Tests:
 *    - Full registration → verification flow
 *    - Registration → login (blocked) → verify → login (success)
 *    - Resend code multiple times
 *    - Code expiration after 15 minutes
 *    - Max 3 validation attempts per code
 *
 * 8. Security Tests:
 *    - No user enumeration on resend
 *    - Rate limiting enforced
 *    - XSS protection active
 *    - Code invalidation after use
 *    - No timing attacks
 *
 * Implementation Details:
 * - Use @jest/globals for test framework
 * - Mock verificationCodeService
 * - Mock notificationService
 * - Mock database queries
 * - Test HTTP responses
 * - Verify logging calls
 *
 * Run Tests:
 * cd apps/api
 * pnpm test auth.email-verification.test.ts
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('Email Verification API', () => {
  it.todo('Full test suite will be implemented in Phase 22 (Security Testing & Hardening)');

  describe('POST /auth/verify-email', () => {
    it.todo('should verify email with valid code');
    it.todo('should return 400 for invalid code');
    it.todo('should return 400 for expired code');
    it.todo('should return 400 for already verified email');
    it.todo('should update database fields');
    it.todo('should invalidate codes after verification');
    it.todo('should generate JWT with emailVerified: true');
    it.todo('should set httpOnly cookie');
  });

  describe('POST /auth/resend-verification', () => {
    it.todo('should always return success');
    it.todo('should send email for unverified account');
    it.todo('should not send for verified account');
    it.todo('should not send for non-existent account');
    it.todo('should invalidate previous codes');
    it.todo('should respect rate limits');
  });

  describe('POST /auth/register (Modified)', () => {
    it.todo('should create unverified account');
    it.todo('should send verification email');
    it.todo('should not return token');
    it.todo('should not set cookie');
  });

  describe('POST /auth/login (Modified)', () => {
    it.todo('should block unverified users');
    it.todo('should return EMAIL_NOT_VERIFIED code');
    it.todo('should allow verified users');
  });

  describe('Integration Tests', () => {
    it.todo('should complete full registration flow');
    it.todo('should handle blocked login → verify → login');
    it.todo('should handle code expiration');
  });

  describe('Security Tests', () => {
    it.todo('should prevent user enumeration');
    it.todo('should enforce rate limits');
    it.todo('should protect against XSS');
    it.todo('should invalidate codes after use');
  });
});
```

2. **Create email template test structure** (apps/api/src/services/__tests__/notification.service.email-verification.test.ts):

```typescript
/**
 * Email Verification Email Template Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22.
 *
 * Test Coverage Required:
 *
 * 1. Email Generation:
 *    - Correct subject line with company name
 *    - Displays 6-digit code correctly
 *    - Shows expiry time (15 minutes)
 *    - Uses customer first name when available
 *    - Uses generic greeting when name not available
 *    - Includes blue envelope icon
 *    - Includes "Didn't create account" note
 *    - Includes support contact link
 *
 * 2. Template Rendering:
 *    - HTML escapes user input (firstName, email)
 *    - Renders responsive design
 *    - Uses correct color scheme (blue primary)
 *    - Wraps in customer template
 *    - Plain text fallback generated
 *
 * 3. Integration:
 *    - Calls mailerService.sendEmail
 *    - Returns true on success
 *    - Returns false on failure
 *    - Logs email send attempt
 *
 * 4. Security:
 *    - XSS protection on firstName
 *    - No sensitive data in email
 *    - Code displayed safely
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('sendEmailVerification', () => {
  it.todo('Full test suite in Phase 22');

  describe('Email Generation', () => {
    it.todo('should generate correct subject');
    it.todo('should display code correctly');
    it.todo('should show expiry time');
    it.todo('should use first name when available');
  });

  describe('Template Rendering', () => {
    it.todo('should escape HTML in user input');
    it.todo('should render responsive design');
    it.todo('should use correct colors');
  });

  describe('Security', () => {
    it.todo('should protect against XSS');
    it.todo('should not include sensitive data');
  });
});
```

3. **Create frontend test structure** (apps/lab404-website/src/components/forms/__tests__/email-verification-form.test.tsx):

```typescript
/**
 * Email Verification Form Component Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22.
 *
 * Test Coverage Required:
 *
 * 1. Rendering:
 *    - Displays email from URL params
 *    - Shows code input field
 *    - Shows resend button
 *    - Shows expiry notice
 *
 * 2. Form Validation:
 *    - Requires 6-digit code
 *    - Rejects non-numeric codes
 *    - Rejects codes < 6 digits
 *    - Shows validation errors
 *
 * 3. Form Submission:
 *    - Calls verifyEmail on submit
 *    - Shows loading state
 *    - Shows success toast
 *    - Redirects to /account on success
 *    - Shows error toast on failure
 *
 * 4. Resend Functionality:
 *    - Calls resendVerificationEmail
 *    - Shows 60-second cooldown
 *    - Disables button during cooldown
 *    - Shows success toast
 *
 * 5. Code Input:
 *    - Supports paste (clipboard)
 *    - Extracts digits from pasted text
 *    - Max length 6 characters
 *    - Numeric keyboard on mobile
 *    - Large touch-friendly input
 *
 * 6. Accessibility:
 *    - Proper ARIA labels
 *    - Error message associations
 *    - Keyboard navigation
 *    - Focus management
 *
 * 7. Mobile Optimization:
 *    - 16px font size (no iOS zoom)
 *    - 44px touch targets
 *    - Responsive layout
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('EmailVerificationForm', () => {
  it.todo('Full test suite in Phase 22');

  describe('Rendering', () => {
    it.todo('should display email from URL');
    it.todo('should show code input');
    it.todo('should show resend button');
  });

  describe('Form Validation', () => {
    it.todo('should require 6 digits');
    it.todo('should reject non-numeric');
    it.todo('should show validation errors');
  });

  describe('Form Submission', () => {
    it.todo('should call verifyEmail');
    it.todo('should show loading state');
    it.todo('should redirect on success');
    it.todo('should show error on failure');
  });

  describe('Resend Functionality', () => {
    it.todo('should call resendVerificationEmail');
    it.todo('should show cooldown timer');
    it.todo('should disable during cooldown');
  });

  describe('Code Input', () => {
    it.todo('should support paste');
    it.todo('should extract digits from paste');
    it.todo('should limit to 6 characters');
  });

  describe('Accessibility', () => {
    it.todo('should have proper ARIA labels');
    it.todo('should associate error messages');
    it.todo('should support keyboard nav');
  });

  describe('Mobile Optimization', () => {
    it.todo('should use 16px font size');
    it.todo('should have 44px touch targets');
  });
});
```

**Commit Message**: `test(17-16): add email verification test structure`

---

## Success Criteria

- [ ] Database migration applied (emailVerified columns added)
- [ ] Existing users auto-verified (no disruption)
- [ ] Verification email method implemented
- [ ] Verify email endpoint functional
- [ ] Resend verification endpoint functional
- [ ] Registration modified (no auto-login)
- [ ] Login modified (blocks unverified)
- [ ] JWT includes emailVerified field
- [ ] Frontend validation schemas created
- [ ] Auth store methods implemented
- [ ] Verification form component created
- [ ] Verification page created
- [ ] Registration redirects to verification
- [ ] Login handles unverified users
- [ ] Test structure documented
- [ ] 16 atomic git commits created
- [ ] No TypeScript errors
- [ ] No breaking changes for verified users

---

## Testing Checklist (Manual Validation)

**Registration Flow**:
- [ ] New registration creates unverified account
- [ ] Verification email sent and received
- [ ] Email contains 6-digit code
- [ ] Email rendering correct (desktop and mobile)
- [ ] No auto-login after registration
- [ ] Redirect to verification page works

**Verification Flow**:
- [ ] Verification page loads with email pre-filled
- [ ] Code input accepts 6 digits
- [ ] Paste support works
- [ ] Valid code verifies email
- [ ] Auto-login after verification
- [ ] Redirect to account page
- [ ] Invalid code shows error
- [ ] Expired code shows error

**Resend Flow**:
- [ ] Resend button works
- [ ] New code received
- [ ] 60-second cooldown enforced
- [ ] Rate limiting works (3 per hour)

**Login Flow**:
- [ ] Unverified user blocked from login
- [ ] Error message clear
- [ ] Redirect to verification page
- [ ] Verified user logs in normally

**Existing Users**:
- [ ] Existing users remain verified
- [ ] Existing users can log in
- [ ] No disruption to verified accounts

---

## Dependencies

**Existing Services**:
- ✅ `verificationCodeService` (Phase 13)
- ✅ `notificationService` (Phase 13, 16)
- ✅ `mailerService` (Phase 13)
- ✅ `logger` utility
- ✅ SMTP configuration

**No New Dependencies**:
- ✅ No new npm packages
- ✅ No new environment variables
- ✅ Database migration script only

---

## Phase Completion

After completing all 16 tasks:

1. **Manual Testing**:
   - Test complete registration → verification flow
   - Test login blocking for unverified users
   - Test resend functionality
   - Test email rendering in multiple clients
   - Verify existing users unaffected

2. **Git Commits**:
   - 16 atomic commits (feat/test types)
   - Meaningful commit messages
   - All commits pushed

3. **Documentation**:
   - ASSUMPTIONS.md ✅
   - PLAN.md ✅
   - Test structure documented ✅

4. **Move to Phase 18**:
   - Phase 17 complete
   - Ready for session management implementation
   - Email verification infrastructure operational

---

## Notes

- **Focused scope**: Email verification for new signups only
- **Backward compatible**: Existing users auto-verified
- **Security-first**: No user enumeration, rate limiting, code invalidation
- **Mobile-optimized**: Touch-friendly inputs, proper keyboard types
- **Reuse patterns**: Phase 13 verification infrastructure, Phase 15 form patterns
- **Test implementation deferred**: Phase 22 will add comprehensive tests
- **Non-breaking**: Verified users experience no changes
