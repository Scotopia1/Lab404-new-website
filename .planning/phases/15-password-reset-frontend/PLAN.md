# Phase 15: Password Reset Frontend Flow - Implementation Plan

## Overview
Implement user-friendly 3-step password reset flow with form validation, error handling, loading states, and auto-login on success.

**Phase Goals**:
- ✅ Multi-step form component (email → code → password)
- ✅ Form validation with Zod + react-hook-form
- ✅ API integration with Phase 14 backend
- ✅ Auto-login after successful password reset
- ✅ Mobile-responsive design with touch-friendly controls
- ✅ Comprehensive error handling and user feedback

**Dependencies**: Phase 14 (Password Reset Backend API) ✅

**Estimated Tasks**: 6 tasks

---

## Task 1: Create Zod Validation Schemas

**Objective**: Define type-safe validation schemas for all 3 password reset steps

**Files to Create**:
- `apps/lab404-website/src/lib/validations/password-reset.ts`

**Implementation Steps**:

1. **Create validation file**:
```typescript
import { z } from 'zod';

/**
 * Step 1: Email input validation
 */
export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email too long'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Step 2: Code verification validation
 */
export const verifyCodeSchema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

/**
 * Step 3: Password reset validation
 */
export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .refine(
      (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd),
      {
        message: 'Password must contain uppercase, lowercase, and number',
      }
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

**Validation Rules**:
- Email: Required, valid format, max 255 chars
- Code: Exactly 6 digits, numeric only
- Password: 8-100 chars, uppercase, lowercase, number
- Confirm Password: Must match new password

**Rationale**: Matches backend validation exactly (Phase 14)

**Commit Message**: `feat(15-01): add password reset validation schemas`

---

## Task 2: Extend Auth Store with Password Reset Methods

**Objective**: Add password reset methods to Zustand auth store

**Files to Modify**:
- `apps/lab404-website/src/stores/useAuthStore.ts`

**Implementation Steps**:

1. **Add types for API responses**:
```typescript
interface ForgotPasswordResponse {
  success: boolean;
  data: {
    message: string;
  };
}

interface VerifyCodeResponse {
  success: boolean;
  data: {
    valid: boolean;
  };
}

interface ResetPasswordResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expiresAt: string;
  };
}
```

2. **Extend AuthState interface**:
```typescript
interface AuthState {
  // ... existing state

  // Password reset methods
  forgotPassword: (email: string) => Promise<string>;
  verifyResetCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}
```

3. **Implement forgotPassword method**:
```typescript
forgotPassword: async (email: string) => {
  set({ isLoading: true, error: null });
  try {
    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email: email.toLowerCase().trim(),
    });
    set({ isLoading: false });
    return response.data.data.message;
  } catch (error) {
    const err = error as AxiosError<{ error: { message: string } }>;
    const errorMsg = err.response?.data?.error?.message || 'Failed to send reset code';
    set({ error: errorMsg, isLoading: false });
    throw new Error(errorMsg);
  }
},
```

4. **Implement verifyResetCode method**:
```typescript
verifyResetCode: async (email: string, code: string) => {
  set({ isLoading: true, error: null });
  try {
    const response = await api.post<VerifyCodeResponse>('/auth/verify-reset-code', {
      email: email.toLowerCase().trim(),
      code,
    });
    set({ isLoading: false });
    return response.data.data.valid;
  } catch (error) {
    const err = error as AxiosError<{ error: { message: string } }>;
    let errorMsg = 'Invalid or expired code';

    if (err.response?.status === 429) {
      errorMsg = 'Too many attempts. Please try again in 1 hour.';
    } else if (err.response?.data?.error?.message) {
      errorMsg = err.response.data.error.message;
    }

    set({ error: errorMsg, isLoading: false });
    throw new Error(errorMsg);
  }
},
```

5. **Implement resetPassword method** (with auto-login):
```typescript
resetPassword: async (email: string, code: string, newPassword: string) => {
  set({ isLoading: true, error: null });
  try {
    const response = await api.post<ResetPasswordResponse>('/auth/reset-password', {
      email: email.toLowerCase().trim(),
      code,
      newPassword,
    });

    // Auto-login: Update auth state
    set({
      user: response.data.data.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    const err = error as AxiosError<{ error: { message: string } }>;
    let errorMsg = 'Failed to reset password';

    if (err.response?.status === 400) {
      errorMsg = 'Invalid or expired code';
    } else if (err.response?.status === 422) {
      errorMsg = err.response?.data?.error?.message || 'Password does not meet requirements';
    } else if (err.response?.data?.error?.message) {
      errorMsg = err.response.data.error.message;
    }

    set({ error: errorMsg, isLoading: false });
    throw new Error(errorMsg);
  }
},
```

**Error Handling**:
- 400: Invalid/expired code
- 422: Validation error (weak password)
- 429: Rate limit exceeded
- Generic: Connection failure

**Rationale**: Centralized auth logic, consistent with existing auth store pattern

**Commit Message**: `feat(15-02): extend auth store with password reset methods`

---

## Task 3: Create Password Reset Form Component

**Objective**: Build multi-step form component managing all 3 steps

**Files to Create**:
- `apps/lab404-website/src/components/forms/password-reset-form.tsx`

**Implementation Steps**:

1. **Create component file with imports**:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import {
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type VerifyCodeInput,
  type ResetPasswordInput,
} from '@/lib/validations/password-reset';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
```

2. **Define component state and types**:
```typescript
type Step = 'email' | 'code' | 'password';

export function PasswordResetForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { forgotPassword, verifyResetCode, resetPassword, isLoading } = useAuthStore();
```

3. **Create Step 1 form (Email Input)**:
```typescript
  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleEmailSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    try {
      await forgotPassword(data.email);
      setEmail(data.email);
      setStep('code');
      toast.success('Check your email for the verification code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    }
  };
```

4. **Create Step 2 form (Code Verification)**:
```typescript
  const codeForm = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const handleCodeSubmit = async (data: VerifyCodeInput) => {
    setError(null);
    try {
      await verifyResetCode(email, data.code);
      setCode(data.code);
      setStep('password');
      toast.success('Code verified successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    }
  };
```

5. **Create Step 3 form (Password Reset)**:
```typescript
  const passwordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handlePasswordSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    try {
      await resetPassword(email, code, data.newPassword);
      toast.success('Password reset successfully! You are now logged in.');
      router.push('/account/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };
```

6. **Create helper functions**:
```typescript
  const goBackToEmail = () => {
    setStep('email');
    setError(null);
    codeForm.reset();
  };

  const handlePasteCode = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedText)) {
      codeForm.setValue('code', pastedText);
      e.preventDefault();
    }
  };
```

7. **Render Card container**:
```typescript
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {step === 'email' && 'Enter your email address to receive a reset code'}
          {step === 'code' && 'Enter the 6-digit code sent to your email'}
          {step === 'password' && 'Create your new password'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <p>{error}</p>
          </Alert>
        )}

        {/* Render appropriate step */}
        {step === 'email' && <EmailStep />}
        {step === 'code' && <CodeStep />}
        {step === 'password' && <PasswordStep />}
      </CardContent>
    </Card>
  );
}
```

8. **Render Step 1: Email Input**:
```typescript
  const EmailStep = () => (
    <Form {...emailForm}>
      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
        <FormField
          control={emailForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  autoFocus
                  disabled={isLoading}
                  className="text-base" // Prevent iOS zoom
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !emailForm.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Sending Code...' : 'Send Reset Code'}
        </Button>
      </form>
    </Form>
  );
```

9. **Render Step 2: Code Verification**:
```typescript
  const CodeStep = () => (
    <div className="space-y-4">
      {/* Show email with edit option */}
      <div className="p-3 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">Code sent to:</p>
        <div className="flex items-center justify-between">
          <p className="font-medium">{email}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={goBackToEmail}
            disabled={isLoading}
          >
            Edit
          </Button>
        </div>
      </div>

      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
          <FormField
            control={codeForm.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                    disabled={isLoading}
                    onPaste={handlePasteCode}
                    className="text-center text-2xl tracking-widest font-mono text-base"
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Code expires in 15 minutes
                </p>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading || !codeForm.formState.isValid}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={goBackToEmail}
              disabled={isLoading}
              className="text-sm text-primary hover:underline"
            >
              Didn't receive code? Resend
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
```

10. **Render Step 3: Password Reset**:
```typescript
  const PasswordStep = () => (
    <Form {...passwordForm}>
      <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
        <FormField
          control={passwordForm.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    autoFocus
                    disabled={isLoading}
                    className="pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Must contain uppercase, lowercase, and number
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={passwordForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    className="pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading || !passwordForm.formState.isValid}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </Form>
  );
}
```

**Key Features**:
- ✅ 3-step multi-step form with state management
- ✅ Zod validation on all fields
- ✅ Loading states with spinners
- ✅ Password visibility toggles
- ✅ Email edit functionality in Step 2
- ✅ Code paste support
- ✅ Error display with Alert component
- ✅ Toast notifications for success
- ✅ Auto-login after successful reset
- ✅ Mobile-friendly (16px inputs, 44x44px buttons)
- ✅ Accessibility (autoFocus, aria-labels, autocomplete)

**Commit Message**: `feat(15-03): create password reset form component`

---

## Task 4: Create Password Reset Page

**Objective**: Create page wrapper for password reset form

**Files to Create**:
- `apps/lab404-website/src/app/(auth)/reset-password/page.tsx`

**Implementation Steps**:

1. **Create page file**:
```typescript
import { PasswordResetForm } from '@/components/forms/password-reset-form';

export const metadata = {
  title: 'Reset Password | Lab404 Electronics',
  description: 'Reset your account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <PasswordResetForm />
    </div>
  );
}
```

**Layout**:
- Centered container
- Full viewport height (minus header)
- Vertical padding for mobile
- Inherits from (auth) layout if exists

**Rationale**: Simple wrapper, consistent with login/register pages

**Commit Message**: `feat(15-04): create reset-password page`

---

## Task 5: Add "Forgot Password?" Link to Login Page

**Objective**: Add navigation link from login page to password reset

**Files to Modify**:
- `apps/lab404-website/src/app/(auth)/login/page.tsx` OR
- `apps/lab404-website/src/components/forms/login-form.tsx` (depending on structure)

**Implementation Steps**:

1. **Find login form component**:
```bash
# Search for login form
apps/lab404-website/src/app/(auth)/login/
```

2. **Add import**:
```typescript
import Link from 'next/link';
```

3. **Add link below password field, above submit button**:
```typescript
<FormField name="password" ... />

{/* Add this section */}
<div className="flex justify-end">
  <Link
    href="/reset-password"
    className="text-sm text-primary hover:underline"
  >
    Forgot password?
  </Link>
</div>

<Button type="submit" ...>
```

**Placement**: After password field, before submit button

**Styling**: Small text, primary color, underline on hover

**Rationale**: Standard UX pattern, easy to discover

**Commit Message**: `feat(15-05): add forgot password link to login page`

---

## Task 6: Create Test Structure Documentation

**Objective**: Document comprehensive test scenarios for Phase 22 implementation

**Files to Create**:
- `apps/lab404-website/src/components/forms/__tests__/password-reset-form.test.tsx`

**Implementation Steps**:

1. **Create test documentation file**:
```typescript
/**
 * Password Reset Form Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22 (Security Testing & Hardening).
 * This file documents the test scenarios that should be covered.
 *
 * Test Coverage Required:
 *
 * 1. Step 1 (Email Input) Tests:
 *    - Validates email format
 *    - Rejects empty email
 *    - Rejects invalid email format
 *    - Shows loading state while submitting
 *    - Advances to Step 2 on success
 *    - Shows toast notification on success
 *    - Displays API error in Alert component
 *    - Handles 429 rate limit error
 *    - Handles network errors gracefully
 *    - Stores email in component state
 *    - Email input autofocuses
 *    - Disables form while loading
 *    - Shows correct button text ("Sending Code...")
 *
 * 2. Step 2 (Code Verification) Tests:
 *    - Validates code is 6 digits
 *    - Rejects non-numeric code
 *    - Rejects code shorter than 6 digits
 *    - Rejects code longer than 6 digits
 *    - Shows loading state while submitting
 *    - Advances to Step 3 on success
 *    - Shows toast notification on success
 *    - Displays API error (invalid/expired code)
 *    - Displays email address from Step 1
 *    - "Edit" button returns to Step 1
 *    - "Resend" link returns to Step 1
 *    - Code input autofocuses
 *    - Code input allows paste
 *    - Paste event handler works for 6-digit codes
 *    - Shows expiration warning (15 minutes)
 *    - Handles 429 rate limit error (max attempts)
 *    - Code stored in component state
 *
 * 3. Step 3 (Password Reset) Tests:
 *    - Validates password minimum length (8)
 *    - Validates password contains uppercase
 *    - Validates password contains lowercase
 *    - Validates password contains number
 *    - Validates confirm password matches new password
 *    - Rejects if passwords don't match
 *    - Shows loading state while submitting
 *    - Calls resetPassword with email + code + newPassword
 *    - Updates auth store on success
 *    - Shows toast notification on success
 *    - Redirects to /account/profile on success
 *    - Displays API error (invalid code, weak password)
 *    - Password visibility toggle works
 *    - Confirm password visibility toggle works
 *    - Shows password requirements hint
 *    - Password input autofocuses
 *    - Disables form while loading
 *
 * 4. Multi-Step Flow Tests:
 *    - Initial step is 'email'
 *    - Step advances: email → code → password
 *    - Email persists across steps
 *    - Code persists from Step 2 to Step 3
 *    - Cannot skip steps directly
 *    - Back navigation clears errors
 *    - Step 2 "Edit" button goes back to Step 1
 *    - Step 2 "Resend" button goes back to Step 1
 *    - Error state cleared on step change
 *
 * 5. Error Handling Tests:
 *    - API errors displayed in Alert component
 *    - Zod validation errors shown inline
 *    - Generic error for network failures
 *    - 400 error: "Invalid or expired code"
 *    - 422 error: "Password does not meet requirements"
 *    - 429 error: "Too many attempts. Please try again in 1 hour."
 *    - Errors cleared on field change
 *    - Toast shown on success, Alert shown on error
 *
 * 6. Loading States Tests:
 *    - Submit button disabled while loading
 *    - Submit button shows spinner icon
 *    - Button text changes while loading
 *    - Form inputs disabled while loading
 *    - useAuthStore.isLoading controls loading state
 *
 * 7. Accessibility Tests:
 *    - All inputs have labels
 *    - Error messages associated with inputs
 *    - autofocus on first input each step
 *    - Keyboard navigation works (Tab, Enter)
 *    - aria-labels on password toggle buttons
 *    - FormMessage has role="alert"
 *    - All interactive elements have min 44x44px size
 *
 * 8. Mobile Responsiveness Tests:
 *    - Card is 90vw on mobile, max-w-md on desktop
 *    - Input text-base (16px) to prevent iOS zoom
 *    - Password toggle buttons are 44x44px minimum
 *    - Submit buttons full width, min 44px height
 *    - Proper input types (email, text, numeric)
 *    - autoComplete attributes present
 *
 * 9. Integration Tests:
 *    - Full flow: email → code → password → redirect
 *    - Auth store methods called correctly
 *    - API calls made with correct payloads
 *    - Auth store updated after successful reset
 *    - Router.push called after success
 *    - Toast notifications triggered at right times
 *
 * 10. Edge Cases:
 *    - Empty form submissions blocked
 *    - Double submissions prevented (loading state)
 *    - Code paste with non-numeric chars rejected
 *    - Code paste with wrong length rejected
 *    - Password and confirmPassword mismatch
 *    - Email normalization (lowercase, trim)
 *    - Unicode characters in password
 *    - Special characters in email
 *
 * Implementation Details:
 * - Use @testing-library/react for component tests
 * - Use jest for test framework
 * - Mock useAuthStore with zustand test utils
 * - Mock next/navigation (useRouter, usePathname)
 * - Mock sonner toast library
 * - Simulate user interactions (type, click, paste)
 * - Assert on DOM elements, aria attributes
 * - Test async operations with waitFor
 *
 * Example Test Structure:
 *
 * describe('PasswordResetForm', () => {
 *   beforeEach(() => {
 *     // Reset mocks
 *   });
 *
 *   describe('Step 1: Email Input', () => {
 *     it('should validate email format', () => {
 *       // Test implementation
 *     });
 *   });
 *
 *   describe('Step 2: Code Verification', () => {
 *     it('should validate code is 6 digits', () => {
 *       // Test implementation
 *     });
 *   });
 *
 *   describe('Step 3: Password Reset', () => {
 *     it('should validate password requirements', () => {
 *       // Test implementation
 *     });
 *   });
 *
 *   describe('Multi-Step Flow', () => {
 *     it('should advance through all steps successfully', async () => {
 *       // Test implementation
 *     });
 *   });
 * });
 *
 * Run Tests:
 * cd apps/lab404-website
 * pnpm test password-reset-form.test.tsx
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('PasswordResetForm', () => {
  it.todo('Full test suite will be implemented in Phase 22 (Security Testing & Hardening)');

  describe('Step 1: Email Input', () => {
    it.todo('should validate email format');
    it.todo('should reject empty email');
    it.todo('should advance to Step 2 on success');
    it.todo('should show toast notification');
    it.todo('should display API errors');
    it.todo('should handle rate limit error');
  });

  describe('Step 2: Code Verification', () => {
    it.todo('should validate code is 6 digits');
    it.todo('should reject non-numeric code');
    it.todo('should advance to Step 3 on success');
    it.todo('should handle paste event');
    it.todo('should allow editing email');
    it.todo('should allow resending code');
  });

  describe('Step 3: Password Reset', () => {
    it.todo('should validate password requirements');
    it.todo('should validate passwords match');
    it.todo('should update auth store on success');
    it.todo('should redirect to profile on success');
    it.todo('should toggle password visibility');
  });

  describe('Multi-Step Flow', () => {
    it.todo('should complete full flow successfully');
    it.todo('should persist email across steps');
    it.todo('should clear errors on step change');
  });

  describe('Error Handling', () => {
    it.todo('should display API errors in Alert');
    it.todo('should display validation errors inline');
    it.todo('should handle network failures');
  });

  describe('Loading States', () => {
    it.todo('should disable form while loading');
    it.todo('should show spinner in button');
    it.todo('should change button text');
  });

  describe('Accessibility', () => {
    it.todo('should have labels on all inputs');
    it.todo('should autofocus first input each step');
    it.todo('should have aria-labels on toggles');
  });

  describe('Mobile Responsiveness', () => {
    it.todo('should prevent iOS zoom (16px inputs)');
    it.todo('should have 44x44px touch targets');
    it.todo('should use proper input types');
  });
});
```

**Commit Message**: `test(15-06): add password reset form test structure`

---

## Success Criteria

- [ ] 3-step password reset flow fully functional
- [ ] All forms validated with Zod + react-hook-form
- [ ] Auth store extended with password reset methods
- [ ] API integration working correctly
- [ ] Auto-login after successful reset
- [ ] Redirect to /account/profile on success
- [ ] Error handling comprehensive (API + validation)
- [ ] Loading states with spinners
- [ ] Toast notifications for success
- [ ] Alert component for errors
- [ ] Password visibility toggles working
- [ ] Email can be edited in Step 2
- [ ] Code paste support working
- [ ] Mobile-responsive design (44x44px touch targets, 16px inputs)
- [ ] Accessibility compliant (labels, autofocus, aria-labels)
- [ ] "Forgot password?" link added to login page
- [ ] Test structure documented
- [ ] 6 atomic git commits created
- [ ] No TypeScript errors
- [ ] No breaking changes

---

## Testing Checklist (Manual Validation)

**Step 1: Email Input**
- [ ] Email validation works (valid format required)
- [ ] Loading spinner shows while submitting
- [ ] Advances to Step 2 on success
- [ ] Toast shows "Check your email..."
- [ ] API errors displayed in Alert
- [ ] Rate limit error handled (429)

**Step 2: Code Verification**
- [ ] Code must be exactly 6 digits
- [ ] Only numeric input accepted
- [ ] Loading spinner shows while verifying
- [ ] Advances to Step 3 on success
- [ ] Toast shows "Code verified successfully!"
- [ ] Email displayed with "Edit" button
- [ ] "Resend" link returns to Step 1
- [ ] Code paste works (6-digit codes)
- [ ] Invalid code shows error

**Step 3: Password Reset**
- [ ] Password requirements validated (8 chars, uppercase, lowercase, number)
- [ ] Confirm password must match
- [ ] Password visibility toggles work
- [ ] Loading spinner shows while resetting
- [ ] Success shows toast "Password reset successfully!"
- [ ] Auto-login works (user logged in)
- [ ] Redirects to /account/profile
- [ ] Weak password rejected

**Cross-Cutting**
- [ ] Error Alert clears on field change
- [ ] Forms disabled while loading
- [ ] All buttons ≥44x44px
- [ ] Inputs are 16px (no iOS zoom)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

**Login Page**
- [ ] "Forgot password?" link visible
- [ ] Link navigates to /reset-password

---

## Dependencies

**Phase 14 Backend** (all endpoints functional):
- ✅ POST /api/auth/forgot-password
- ✅ POST /api/auth/verify-reset-code
- ✅ POST /api/auth/reset-password

**npm Packages** (all already installed):
- ✅ react-hook-form (v7.69.0)
- ✅ zod (v3.25.76)
- ✅ @hookform/resolvers (for Zod integration)
- ✅ axios (API client)
- ✅ sonner (toast notifications)
- ✅ lucide-react (icons: Loader2, Eye, EyeOff)
- ✅ shadcn/ui components (Card, Input, Button, Form, Alert)

**Existing Infrastructure**:
- ✅ `apps/lab404-website/src/lib/api.ts` (Axios with CSRF)
- ✅ `apps/lab404-website/src/stores/useAuthStore.ts` (Zustand auth)
- ✅ shadcn/ui components (all required components exist)

---

## Phase Completion

After completing all 6 tasks:

1. **Manual Testing**:
   - Test full flow end-to-end
   - Verify email delivery (check spam folder)
   - Test error scenarios (invalid code, weak password)
   - Test on mobile device
   - Check accessibility with keyboard

2. **Git Commits**:
   - 6 atomic commits (feat/test types)
   - Meaningful commit messages
   - All commits pushed

3. **Documentation**:
   - ASSUMPTIONS.md ✅
   - PLAN.md ✅
   - Test structure documented ✅

4. **Move to Phase 16**:
   - Phase 15 complete
   - Ready for security email templates
   - Frontend password reset fully functional

---

## Notes

- **No new dependencies** - All packages already installed
- **Reuse existing patterns** - Login/register forms as reference
- **Mobile-first** - 16px inputs, 44x44px buttons
- **Accessibility** - Labels, autofocus, aria-labels
- **Security** - Email lowercase normalization, no session persistence
- **Test implementation deferred** - Phase 22 will add comprehensive tests
