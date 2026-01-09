# Phase 17: Email Verification for New Signups - Implementation Assumptions

## Phase Overview
Add email verification requirement for new customer registrations to prevent spam accounts and confirm email ownership before granting full account access.

## Critical Assumptions

### 1. Infrastructure Dependencies
**Assumption**: Reuse Phase 13 verification code infrastructure completely
- ✅ `verificationCodeService` supports 'email_verification' type (Phase 13)
- ✅ `notificationService.sendVerificationCode()` ready for use
- ✅ `verification_codes` table supports all required operations
- ✅ Rate limiting middleware (`verificationLimiter`) already configured
- ✅ Email templates and SMTP infrastructure operational

**Rationale**: No need to rebuild infrastructure, Phase 13 designed for reusability

### 2. Database Schema Changes
**Assumption**: Add email verification tracking to customers table

**New Columns Required**:
```sql
ALTER TABLE customers
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN email_verified_at TIMESTAMP;
```

**Migration Strategy**:
- New registrations: `email_verified = false` by default
- Existing users: Retroactively mark as verified (`email_verified = true`, `email_verified_at = created_at`)

**Rationale**: Don't disrupt existing users who registered before verification system

### 3. Registration Flow Modification
**Assumption**: Change registration to NOT auto-login, send verification email instead

**Current Flow** (auth.routes.ts:123-225):
```typescript
// 1. Create customer account
// 2. Generate JWT token
// 3. Set auth_token cookie
// 4. Return user + token (auto-login)
```

**New Flow**:
```typescript
// 1. Create customer account with email_verified = false
// 2. Generate 6-digit verification code
// 3. Send verification email
// 4. Return success message (NO token, NO auto-login)
// 5. User must verify email before logging in
```

**Rationale**: Email verification is meaningless if user gets immediate access

### 4. User Access Control Strategy
**Assumption**: Block login for unverified users, show verification prompt

**Login Endpoint Modification** (auth.routes.ts:227-315):
- Check `customer.emailVerified` after password validation
- If `false`: Return 403 with `{ verified: false, email }` (NOT 401)
- Allow resend verification code from login page
- If `true`: Normal login flow with token

**Rationale**: Clear user experience, prevents account usage until verification

### 5. Verification Endpoint Design
**Assumption**: Single endpoint for email verification

**New Endpoint**: `POST /api/auth/verify-email`

**Request Body**:
```typescript
{ email: string, code: string }
```

**Flow**:
1. Validate code via `verificationCodeService.validateCode()`
2. If valid: Update `customers.email_verified = true`, `email_verified_at = NOW()`
3. Invalidate all email_verification codes for this email
4. Generate JWT token (auto-login after verification)
5. Set auth_token cookie
6. Return user + token

**Rationale**: Immediate login after verification improves UX

### 6. Resend Verification Code Endpoint
**Assumption**: Allow users to request new verification code

**New Endpoint**: `POST /api/auth/resend-verification`

**Request Body**:
```typescript
{ email: string }
```

**Security**:
- Protected by `verificationLimiter` (3 requests/hour)
- No user enumeration: Always return success message
- Only send if account exists AND not verified
- Invalidate previous codes before creating new one

**Rationale**: Users may miss email, code may expire, need retry mechanism

### 7. Verification Email Template
**Assumption**: Create new email template in NotificationService

**Method**: `sendEmailVerification()` (distinct from `sendVerificationCode()`)

**Email Content**:
- **Subject**: "Verify Your Email Address - Lab404 Electronics"
- **Header**: "Welcome to Lab404 Electronics!"
- **Body**: "Please verify your email address to activate your account"
- **Code Display**: Large, centered 6-digit code
- **Expiration Notice**: "This code expires in 15 minutes"
- **Resend Link**: "Didn't receive the code? Request a new one"
- **Support Contact**: Link to contact support

**Rationale**: Welcoming tone for new users, clear call-to-action

### 8. Frontend Verification Flow
**Assumption**: Multi-page verification flow

**Pages Required**:
1. `/register` - Modified to show "Check your email" message after signup
2. `/verify-email` - New page with 6-digit code input form
3. `/login` - Modified to detect unverified users and redirect to verification

**Flow**:
```
Register → Success message → Check email
User clicks email link or manually navigates to /verify-email
Enter code → Verify → Auto-login → Redirect to /account
```

**Rationale**: Clear linear flow, minimal friction

### 9. Verification Form Component
**Assumption**: Reuse password reset form patterns from Phase 15

**Component**: `EmailVerificationForm.tsx`

**Features**:
- 6-digit code input (same UX as password reset verification step)
- Paste support for codes
- Real-time validation
- "Resend Code" button with cooldown timer
- Loading states
- Error handling
- Mobile-optimized (16px inputs, 44x44px buttons)

**Rationale**: Consistent UX across verification flows

### 10. Auth Store Integration
**Assumption**: Extend Zustand auth store with verification methods

**New Methods**:
```typescript
interface AuthState {
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  verificationPending: boolean;
}
```

**State Management**:
- Store `verificationPending` flag to track if user needs verification
- Clear flag after successful verification
- Persist email address for verification page

**Rationale**: Centralized auth state management

### 11. Zod Validation Schemas
**Assumption**: Create validation schemas for verification endpoints

**New Schemas**:
```typescript
// apps/lab404-website/src/lib/validations/email-verification.ts
export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Numbers only'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});
```

**Rationale**: Type-safe validation matching Phase 15 patterns

### 12. Email Link with Pre-filled Code
**Assumption**: NO magic links, code-based verification only

**Reason**:
- Magic links can be insecure (forwarded emails, shared links)
- Code-based verification provides better security
- Consistent with password reset flow (Phase 14-15)
- Users can manually type code if needed

**Deferred**: Magic link support to future phase

**Rationale**: Security over convenience for account creation

### 13. Verification Code Expiration
**Assumption**: Reuse 15-minute expiration from password reset

**Timing**: Same as Phase 13-14 (15 minutes)
**Max Attempts**: 3 attempts per code
**Rate Limiting**: 3 code requests per hour per email

**Rationale**: Consistent security parameters across all verification types

### 14. Existing User Migration Strategy
**Assumption**: Auto-verify all existing users during migration

**Migration Script**:
```sql
-- Mark all existing customers as verified
UPDATE customers
SET email_verified = TRUE,
    email_verified_at = created_at
WHERE email_verified IS NULL OR email_verified = FALSE;
```

**Rationale**: Don't lock out existing users, only apply to new signups

### 15. Guest Accounts Handling
**Assumption**: Guest accounts bypass email verification

**Logic**:
- If `customer.isGuest = true`, skip verification check
- Guest accounts can't have `emailVerified = true`
- Guest → regular customer conversion requires verification

**Rationale**: Guest checkout shouldn't require email verification

### 16. Account Conversion Flow
**Assumption**: Guest-to-regular conversion requires email verification

**Flow** (apps/api/src/routes/customer.routes.ts - guest conversion endpoint):
1. User converts guest account to regular (sets password)
2. Set `emailVerified = false`
3. Send verification email
4. Require verification before full account access

**Deferred**: Guest conversion implementation to separate phase

**Rationale**: Ensure email ownership for regular accounts

### 17. Verification Status in User Object
**Assumption**: Include `emailVerified` in JWT payload and API responses

**JWT Payload** (apps/api/src/utils/jwt.ts):
```typescript
interface TokenPayload {
  id: string;
  email: string;
  emailVerified: boolean;  // NEW
  isAdmin: boolean;
}
```

**API Response** (apps/api/src/routes/auth.routes.ts):
```typescript
const user = {
  id: customer.id,
  email: customer.email,
  emailVerified: customer.emailVerified,  // NEW
  firstName: customer.firstName,
  lastName: customer.lastName,
};
```

**Rationale**: Frontend needs verification status for UI decisions

### 18. Protected Operations Middleware
**Assumption**: NOT implemented in Phase 17 (future enhancement)

**Deferred**: Middleware to block unverified users from sensitive operations
- Checkout
- Placing orders
- Viewing order history
- Managing addresses

**Reason**: Keep Phase 17 scope focused on registration + verification only

**Rationale**: Phase 17 focuses on registration, operations protection in Phase 18

### 19. Email Change Flow
**Assumption**: NOT implemented in Phase 17

**Deferred**: Changing email requires re-verification (future phase)
- User changes email in profile
- Set `emailVerified = false`
- Send verification to new email
- Block sensitive operations until verified

**Rationale**: Out of scope for Phase 17, future feature

### 20. Verification Reminder Emails
**Assumption**: NO automated reminder emails in Phase 17

**Deferred**: Scheduled reminders to unverified users (future phase)
- 24 hours after signup: "Please verify your email"
- 7 days after signup: "Your account is still unverified"

**Rationale**: Keep Phase 17 minimal, add reminders later

### 21. Email Deliverability Fallback
**Assumption**: Non-blocking email send, log failures

**Implementation**:
```typescript
const emailSent = await notificationService.sendEmailVerification({...});

if (!emailSent) {
  logger.error('Failed to send verification email', { email, customerId });
  // Still return success - don't leak account existence
}
```

**Rationale**: Email failures shouldn't prevent registration

### 22. Verification Status in Login Error
**Assumption**: Special error code for unverified users

**Login Response (unverified)**:
```typescript
return sendError(res, 'Email not verified. Please check your inbox.', 403, {
  code: 'EMAIL_NOT_VERIFIED',
  email: customer.email,  // Allow resend from login page
});
```

**Frontend Handling**:
- Detect `EMAIL_NOT_VERIFIED` code
- Show "Resend verification email" button
- Redirect to `/verify-email?email=...`

**Rationale**: Clear user guidance when verification needed

### 23. Security: No User Enumeration
**Assumption**: Maintain no-enumeration policy for verification endpoints

**Endpoints**:
- `POST /auth/resend-verification`: Always return success
- `POST /auth/verify-email`: Return generic error for invalid code

**Error Messages**:
- ✅ "If an account exists, a verification email has been sent"
- ❌ "This email is not registered"
- ❌ "This account is already verified"

**Rationale**: Prevent attackers from discovering valid email addresses

### 24. XSS Protection on Email Display
**Assumption**: Escape email address when displaying in UI

**Protection**:
- Backend: Already sanitized via `xssSanitize` middleware
- Frontend: React automatically escapes JSX
- Email templates: Use `escapeHtml()` on user-provided data

**Rationale**: Prevent XSS via malicious email addresses

### 25. Rate Limiting Bypass for Admins
**Assumption**: NO admin bypass in Phase 17

**Reason**: Admins don't need to create accounts via registration flow
**Deferred**: Admin user management to separate phase

**Rationale**: Keep Phase 17 scope focused on customer registration

### 26. Verification Code Cleanup
**Assumption**: Reuse existing `cleanupExpiredCodes()` from Phase 13

**Cron Job** (apps/api/src/jobs/verification-cleanup.job.ts):
- Already cleans up all code types including 'email_verification'
- Runs hourly
- No changes needed

**Rationale**: Infrastructure already handles cleanup

### 27. Mobile-First Verification UI
**Assumption**: Follow Phase 8-10 mobile optimization patterns

**Features**:
- 16px input font size (prevent iOS zoom)
- 44x44px minimum touch targets
- Responsive padding and spacing
- Large code input fields
- Touch-friendly "Resend" button

**Rationale**: Consistent mobile UX with rest of app

### 28. Accessibility Requirements
**Assumption**: WCAG 2.1 AA compliance for verification flow

**Features**:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Error message associations

**Rationale**: Accessible registration is critical for inclusivity

### 29. Testing Strategy
**Assumption**: Manual testing in Phase 17, automated in Phase 22

**Test Cases to Document**:
- Registration creates unverified account
- Verification email sends correctly
- Code validation works
- Login blocks unverified users
- Resend code functionality
- Expired code handling
- Invalid code handling
- Existing users remain verified after migration

**Deferred**: Automated test implementation to Phase 22

**Rationale**: Consistent with Phase 13-16 testing approach

### 30. Email Template Styling
**Assumption**: Reuse existing `wrapCustomerTemplate()` design

**Colors**:
- Header gradient: `#1e40af` → `#3b82f6` (blue)
- Code display: `#2563eb` (blue box, large font)
- Success indicator: `#16a34a` (green after verification)
- Text: `#1f2937` (dark gray)
- Background: `#f3f4f6` (light gray)

**Layout**:
- Max-width: 600px
- Responsive design
- Table-based structure (email client compatible)

**Rationale**: Consistent branding with other email templates

### 31. TypeScript Types
**Assumption**: Create centralized types for email verification

**New Types File**: `apps/lab404-website/src/types/email-verification.ts`

**Types**:
```typescript
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface VerificationErrorResponse {
  code: 'EMAIL_NOT_VERIFIED' | 'INVALID_CODE' | 'CODE_EXPIRED';
  email?: string;
}
```

**Rationale**: Type safety across frontend and backend

### 32. Success Page After Verification
**Assumption**: Redirect to account dashboard after successful verification

**Flow**:
```
Verify email → Auto-login → Redirect to /account
Show success toast: "Email verified! Welcome to Lab404 Electronics."
```

**No Dedicated Success Page**: Use toast notification instead

**Rationale**: Minimize friction, get user into app quickly

### 33. Environment Variables
**Assumption**: No new environment variables required

**Existing Config** (sufficient):
- `SMTP_*` variables (email sending)
- `JWT_SECRET` (token generation)
- `COMPANY_NAME` (email branding)

**Rationale**: Reuse existing configuration

### 34. Logging & Monitoring
**Assumption**: Log all verification events for audit trail

**Log Events**:
- Registration created (unverified)
- Verification email sent (success/failure)
- Verification code validated (success/failure)
- Account verified (timestamp)
- Resend requests
- Login attempts by unverified users

**Include in Logs**: email, customerId, timestamp, ipAddress

**Rationale**: Security audit trail, troubleshooting

### 35. Performance Considerations
**Assumption**: Minimal performance impact

**Expected Load**:
- Database: 2 new columns (indexed), negligible impact
- API: 2 new endpoints (lightweight operations)
- Email: Non-blocking async sending

**Optimization**: Email sending already non-blocking in Phase 13

**Rationale**: No performance concerns expected

---

## Assumptions Summary

**Total Assumptions**: 35

**Categories**:
- Infrastructure & Dependencies: 5 assumptions
- Database & Schema: 4 assumptions
- Authentication Flow: 7 assumptions
- Email & Templates: 5 assumptions
- Frontend Implementation: 6 assumptions
- Security & Privacy: 4 assumptions
- Technical Implementation: 4 assumptions

**High-Risk Assumptions** (require validation):
1. Login block for unverified users (assumption #4) - UX impact
2. Existing user migration strategy (assumption #14) - data integrity
3. No protected operations middleware (assumption #18) - security consideration
4. JWT payload modification (assumption #17) - backward compatibility

**Dependencies**:
- Phase 13 must be operational ✅
- Email infrastructure working ✅
- Database migration capability ✅
- No new npm packages ✅

**Deferred to Future Phases**:
- Protected operations middleware → Phase 18
- Email change verification → Future
- Reminder emails → Future
- Magic link support → Future
- Guest account conversion → Future

**Key Decisions**:
- Block login for unverified users (strict verification)
- Auto-verify existing users (no disruption)
- Code-based verification only (no magic links)
- Auto-login after successful verification (UX optimization)
- Reuse all Phase 13 infrastructure (no duplication)

---

## Risk Assessment

**Low Risk**:
- Infrastructure reuse (proven in Phase 13)
- Database migration (straightforward)
- Email template creation (established patterns)

**Medium Risk**:
- Login flow modification (affects all users)
- Existing user migration (data integrity critical)
- JWT payload changes (session management impact)

**Mitigation Strategies**:
- Thorough testing of login flow
- Database migration with rollback plan
- Existing users auto-verified (zero disruption)
- JWT change backward compatible (email_verified optional in token verification)

---

## Success Metrics

**Functional**:
- [ ] New registrations require email verification
- [ ] Unverified users cannot log in
- [ ] Verification email delivered successfully
- [ ] Code validation works correctly
- [ ] Existing users unaffected

**Security**:
- [ ] No user enumeration vulnerabilities
- [ ] Rate limiting prevents abuse
- [ ] XSS protection on email fields
- [ ] Verification logs captured

**UX**:
- [ ] Clear error messages for unverified login
- [ ] Resend code functionality works
- [ ] Mobile-optimized verification form
- [ ] Auto-login after verification
