# Phase 16: Security Email Templates - Implementation Plan

## Overview
Add password changed confirmation email triggered after successful password reset for enhanced account security.

**Phase Goals**:
- ✅ Password changed confirmation email
- ✅ Professional HTML template with security messaging
- ✅ Trigger from password reset endpoint
- ✅ Non-blocking email delivery

**Dependencies**: Phase 13-15 complete ✅

**Estimated Tasks**: 3 tasks

---

## Task 1: Add Password Changed Confirmation Email Method

**Objective**: Create `sendPasswordChangedConfirmation()` method in NotificationService

**Files to Modify**:
- `apps/api/src/services/notification.service.ts`

**Implementation Steps**:

1. **Add method after existing `sendVerificationCode()` method** (around line 493):

```typescript
/**
 * Send password changed confirmation email
 * Notifies user of successful password change with timestamp and IP
 */
async sendPasswordChangedConfirmation(data: {
  email: string;
  firstName: string | null;
  timestamp: Date;
  ipAddress?: string;
}): Promise<boolean> {
  const { email, firstName, timestamp, ipAddress } = data;
  const companyName = process.env.COMPANY_NAME || 'Lab404 Electronics';

  // Format timestamp for display
  const formattedTimestamp = timestamp.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';

  const html = this.wrapCustomerTemplate(`
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #16a34a; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">
        ✓
      </div>
    </div>

    <h2 style="color: #1f2937; margin-bottom: 24px; text-align: center;">
      Password Changed Successfully
    </h2>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
      ${greeting}
    </p>

    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
      Your password was successfully changed on <strong>${formattedTimestamp}</strong>.
    </p>

    ${ipAddress ? `
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>Security Details:</strong><br>
          From IP address: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace;">${ipAddress}</code>
        </p>
      </div>
    ` : ''}

    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="color: #dc2626; font-weight: bold; font-size: 16px; margin: 0 0 12px 0;">
        ⚠️ Did you make this change?
      </p>
      <p style="color: #991b1b; font-size: 14px; line-height: 20px; margin: 0;">
        If you did not change your password, please contact our support team immediately to secure your account.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="mailto:contact@lab404electronics.com?subject=Unauthorized%20Password%20Change"
         style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Contact Support
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin-top: 30px;">
      For security reasons, we recommend using a strong, unique password and enabling two-factor authentication when available.
    </p>
  `, companyName);

  logger.info('Sending password changed confirmation email', { email });

  return mailerService.sendEmail({
    to: email,
    subject: `Your Password Was Changed - ${companyName}`,
    html,
  });
}
```

**Key Features**:
- ✅ Green checkmark visual confirmation
- ✅ Formatted timestamp display
- ✅ IP address context (if available)
- ✅ Security warning box
- ✅ Contact support CTA button
- ✅ Professional responsive design

**Commit Message**: `feat(16-01): add password changed confirmation email method`

---

## Task 2: Trigger Email from Password Reset Endpoint

**Objective**: Send confirmation email after successful password reset

**Files to Modify**:
- `apps/api/src/routes/auth.routes.ts`

**Implementation Steps**:

1. **Find the reset-password endpoint** (line ~582)

2. **Add email trigger after password update, before token generation** (around line ~665):

```typescript
// Update password
await db
  .update(customers)
  .set({
    passwordHash,
    updatedAt: new Date(),
  })
  .where(eq(customers.id, customer.id));

// Invalidate all password_reset codes
await verificationCodeService.invalidateCodes(
  normalizedEmail,
  'password_reset'
);

// NEW: Send password changed confirmation email (non-blocking)
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
const token = generateToken({...});
```

**Non-Blocking**: Email failure logged but doesn't prevent password reset success

**Rationale**: User gets confirmation email immediately after password change

**Commit Message**: `feat(16-02): trigger password changed email after reset`

---

## Task 3: Create Test Structure Documentation

**Objective**: Document comprehensive test scenarios for Phase 22 implementation

**Files to Create**:
- `apps/api/src/services/__tests__/notification.service.password-changed.test.ts`

**Implementation Steps**:

1. **Create test documentation file**:

```typescript
/**
 * Password Changed Confirmation Email Tests
 *
 * NOTE: Comprehensive testing will be performed in Phase 22 (Security Testing & Hardening).
 * This file documents the test scenarios that should be covered.
 *
 * Test Coverage Required:
 *
 * 1. Email Generation Tests:
 *    - Generates correct subject line
 *    - Includes company name in subject
 *    - Displays formatted timestamp
 *    - Shows IP address when provided
 *    - Hides IP section when not provided
 *    - Uses customer first name when available
 *    - Uses generic greeting when name not available
 *    - Includes green checkmark icon
 *    - Includes security warning box
 *    - Includes contact support button
 *    - Mailto link has correct subject
 *
 * 2. Template Rendering Tests:
 *    - HTML escapes user input (firstName, email)
 *    - Renders responsive design (max-width 600px)
 *    - Uses correct color scheme (green checkmark, blue button, red warning)
 *    - Wraps in customer template
 *    - Includes company footer
 *    - Plain text fallback generated
 *
 * 3. Integration Tests:
 *    - Calls mailerService.sendEmail with correct params
 *    - Returns true on successful send
 *    - Returns false on send failure
 *    - Logs email send attempt
 *    - Logs email send failure
 *
 * 4. Timestamp Formatting Tests:
 *    - Uses en-US locale
 *    - Shows month name (not number)
 *    - Shows 12-hour time format
 *    - Includes AM/PM
 *    - Includes timezone (UTC, EST, etc.)
 *
 * 5. Security Tests:
 *    - XSS protection (escapeHtml on firstName)
 *    - No password included in email
 *    - IP address displayed safely
 *    - mailto link properly URL encoded
 *
 * 6. Edge Cases:
 *    - Null firstName (generic greeting)
 *    - Undefined ipAddress (section hidden)
 *    - Very long firstName (truncated/escaped)
 *    - Special characters in firstName
 *    - IPv6 address display
 *    - Future timestamp (shouldn't happen)
 *
 * Implementation Details:
 * - Use @jest/globals for test framework
 * - Mock mailerService.sendEmail
 * - Mock logger methods
 * - Test HTML content parsing
 * - Verify email subject and body
 *
 * Example Test Structure:
 *
 * describe('sendPasswordChangedConfirmation', () => {
 *   beforeEach(() => {
 *     // Reset mocks
 *   });
 *
 *   it('should send email with correct subject', async () => {
 *     // Test implementation
 *   });
 *
 *   it('should include formatted timestamp', async () => {
 *     // Test implementation
 *   });
 *
 *   it('should show IP address when provided', async () => {
 *     // Test implementation
 *   });
 *
 *   it('should hide IP section when not provided', async () => {
 *     // Test implementation
 *   });
 * });
 *
 * Run Tests:
 * cd apps/api
 * pnpm test notification.service.password-changed.test.ts
 *
 * Full test implementation scheduled for Phase 22.
 */

import { describe, it } from '@jest/globals';

describe('sendPasswordChangedConfirmation', () => {
  it.todo('Full test suite will be implemented in Phase 22 (Security Testing & Hardening)');

  describe('Email Generation', () => {
    it.todo('should generate correct subject line');
    it.todo('should include company name');
    it.todo('should display formatted timestamp');
    it.todo('should show IP address when provided');
    it.todo('should hide IP when not provided');
    it.todo('should use first name when available');
    it.todo('should use generic greeting without name');
  });

  describe('Template Rendering', () => {
    it.todo('should escape HTML in user input');
    it.todo('should render responsive design');
    it.todo('should use correct color scheme');
    it.todo('should wrap in customer template');
  });

  describe('Integration', () => {
    it.todo('should call mailerService with correct params');
    it.todo('should return true on success');
    it.todo('should return false on failure');
    it.todo('should log email attempts');
  });

  describe('Security', () => {
    it.todo('should protect against XSS');
    it.todo('should not include password');
    it.todo('should safely display IP address');
  });

  describe('Edge Cases', () => {
    it.todo('should handle null firstName');
    it.todo('should handle undefined ipAddress');
    it.todo('should handle special characters');
    it.todo('should handle IPv6 addresses');
  });
});
```

**Commit Message**: `test(16-03): add password changed email test structure`

---

## Success Criteria

- [ ] Password changed confirmation email method implemented
- [ ] Email triggered after successful password reset
- [ ] Email contains all required information (timestamp, IP, security warning)
- [ ] Non-blocking email delivery (failures logged, not thrown)
- [ ] Professional HTML template with responsive design
- [ ] XSS protection on user inputs
- [ ] Test structure documented for Phase 22
- [ ] 3 atomic git commits created
- [ ] No TypeScript errors
- [ ] No breaking changes

---

## Testing Checklist (Manual Validation)

**Email Content**:
- [ ] Subject line correct
- [ ] Green checkmark displays
- [ ] Timestamp formatted correctly
- [ ] IP address shown (when available)
- [ ] Security warning box prominent
- [ ] Contact support button clickable
- [ ] mailto link works with pre-filled subject

**Email Rendering**:
- [ ] Responsive design (mobile and desktop)
- [ ] Colors correct (green checkmark, blue button, red warning)
- [ ] Gmail renders correctly
- [ ] Outlook renders correctly
- [ ] Plain text fallback works

**Integration**:
- [ ] Email sent after password reset
- [ ] Email failure doesn't prevent reset
- [ ] Logging works correctly

---

## Dependencies

**Existing Services**:
- ✅ `notificationService` (apps/api/src/services/notification.service.ts)
- ✅ `mailerService` (apps/api/src/services/mailer.service.ts)
- ✅ `logger` utility
- ✅ `wrapCustomerTemplate()` method
- ✅ SMTP configuration

**No New Dependencies**:
- ✅ No new npm packages
- ✅ No new environment variables
- ✅ No database changes

---

## Phase Completion

After completing all 3 tasks:

1. **Manual Testing**:
   - Trigger password reset flow
   - Verify email received
   - Check email content and formatting
   - Test in multiple email clients

2. **Git Commits**:
   - 3 atomic commits (feat/test types)
   - Meaningful commit messages
   - All commits pushed

3. **Documentation**:
   - ASSUMPTIONS.md ✅
   - PLAN.md ✅
   - Test structure documented ✅

4. **Move to Phase 17**:
   - Phase 16 complete
   - Ready for email verification on signup
   - Security email infrastructure enhanced

---

## Notes

- **Focused scope**: Single email only (password changed)
- **Non-blocking**: Email failures don't prevent password reset
- **Reuse patterns**: Follows existing email template structure
- **Mobile-first**: Responsive design for all devices
- **Security-first**: Clear warning if unauthorized change
- **Test implementation deferred**: Phase 22 will add comprehensive tests
