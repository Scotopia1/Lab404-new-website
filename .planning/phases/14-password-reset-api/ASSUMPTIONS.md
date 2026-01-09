# Phase 14: Password Reset Backend API - Implementation Assumptions

## Phase Overview
Implement secure password reset functionality using 3 REST API endpoints that leverage the verification code system from Phase 13.

## Critical Assumptions

### 1. Infrastructure Dependencies
**Assumption**: Phase 13 verification code system is fully operational
- ✅ `verificationCodeService` with createCode(), validateCode(), invalidateCodes()
- ✅ `verificationCodes` database table with 'password_reset' type support
- ✅ `verificationLimiter` middleware (3 requests/hour by email)
- ✅ `notificationService.sendVerificationCode()` email template
- ✅ Cron cleanup endpoint for expired codes

**Rationale**: Password reset endpoints depend on Phase 13 infrastructure

### 2. Authentication Architecture
**Assumption**: Existing auth patterns will be followed exactly
- Express Router with middleware composition
- Zod schemas for request validation
- `validateBody(schema)` middleware
- `sendSuccess()` and `sendError()` response utilities
- JWT token generation with httpOnly cookies
- bcryptjs for password hashing (12 salt rounds)

**Rationale**: Consistency with apps/api/src/routes/auth.routes.ts patterns

### 3. Security Requirements

#### No User Enumeration
**Assumption**: Security-first approach - never reveal if email exists
- `/forgot-password` returns 200 success even if email doesn't exist
- Generic error messages: "Invalid or expired verification code"
- Same response time regardless of email existence
- Internal logging only (no client-facing differentiation)

**Rationale**: Prevent account enumeration attacks per OWASP guidelines

#### Rate Limiting Strategy
**Assumption**: Multi-tiered rate limiting for abuse prevention
- `verificationLimiter` (3/hour by email) for:
  - POST /api/auth/forgot-password
  - POST /api/auth/verify-reset-code
- `authLimiter` (5/15min) for:
  - POST /api/auth/reset-password
- Rate limiting by email address from request body (fallback to IP)

**Rationale**: Balance security with legitimate user needs

#### Code Security
**Assumption**: 6-digit codes with strict validation
- Cryptographically secure generation (crypto.randomInt)
- 15-minute expiration window
- Maximum 3 validation attempts
- Auto-invalidation after successful password reset
- Single-use enforcement (isUsed flag)

**Rationale**: Industry standard for temporary verification codes

### 4. Endpoint Specifications

#### Endpoint 1: POST /api/auth/forgot-password
**Assumption**: Request password reset code
```typescript
Request: { email: string }
Response (200): { success: true, data: { message: string } }
Middleware: [verificationLimiter, xssSanitize, validateBody(schema)]
```

**Behavior**:
- Always return 200 (even if email doesn't exist)
- If email exists: create code, send email, log activity
- If email doesn't exist: return success, log attempt
- Generic message: "If an account exists, a verification code has been sent"

**Rationale**: Prevent user enumeration while providing helpful UX

#### Endpoint 2: POST /api/auth/verify-reset-code
**Assumption**: Validate code without resetting password
```typescript
Request: { email: string, code: string }
Response (200): { success: true, data: { valid: true } }
Middleware: [verificationLimiter, xssSanitize, validateBody(schema)]
```

**Purpose**: Allow frontend to validate code before showing password reset form

**Behavior**:
- Calls verificationCodeService.validateCode()
- Returns 400 if invalid/expired/max attempts
- Does NOT invalidate code on success (preserves for reset)
- Increments attempt counter

**Rationale**: Two-step UX (validate code → show password form → reset)

#### Endpoint 3: POST /api/auth/reset-password
**Assumption**: Final password reset with code validation
```typescript
Request: { email: string, code: string, newPassword: string }
Response (200): { success: true, data: { message, user, token, expiresAt } }
Middleware: [authLimiter, xssSanitize, validateBody(schema)]
```

**Behavior**:
- Validate code again (verificationCodeService.validateCode)
- Hash new password with bcrypt (12 rounds)
- Update customer.passwordHash
- Invalidate all password_reset codes for this email
- Generate new JWT token
- Set httpOnly auth cookie
- Return user object + token

**Rationale**: Complete password reset flow with automatic login

### 5. Validation Rules

#### Email Validation
**Assumption**: Strict email format with sanitization
```typescript
z.string()
  .email('Invalid email format')
  .max(255)
  .transform(sanitizeEmail)  // Remove SQL injection chars
```

**Rationale**: Matches existing auth.routes.ts patterns

#### Code Validation
**Assumption**: 6-digit numeric string
```typescript
z.string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d+$/, 'Code must contain only digits')
```

**Rationale**: Enforces verification code format

#### Password Validation
**Assumption**: Strong password requirements
```typescript
z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .refine(isStrongPassword, { message: 'Password must contain uppercase, lowercase, and number' })
  .refine((p) => !WEAK_PASSWORDS.includes(p.toLowerCase()),
    { message: 'Password is too common' })
```

**Constraints**:
- 8-100 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Not in weak password list (123456, password, etc.)

**Rationale**: Matches existing registration password validation

### 6. Error Handling

#### Standard Error Classes
**Assumption**: Use existing error utilities
- `BadRequestError` (400) - Invalid/expired code, validation failures
- `TooManyRequestsError` (429) - Rate limit exceeded
- `ValidationError` (422) - Zod validation errors with field details
- `UnauthorizedError` (401) - Not used in password reset (no enumeration)

**Generic Error Messages**:
- "Invalid or expired verification code" - for any code validation failure
- "If an account exists, a verification code has been sent" - for forgot-password
- "Too many requests. Please try again later." - for rate limits

**Rationale**: Security-first, no information leakage

### 7. Database Operations

#### Customer Lookup
**Assumption**: Case-insensitive email lookup
```typescript
const customer = await db
  .select()
  .from(customers)
  .where(eq(customers.email, email.toLowerCase()))
  .limit(1);
```

**Rationale**: Matches existing auth patterns

#### Password Update
**Assumption**: Atomic update with timestamp
```typescript
await db
  .update(customers)
  .set({
    passwordHash: await bcrypt.hash(newPassword, 12),
    updatedAt: new Date(),
  })
  .where(eq(customers.id, customer.id));
```

**Rationale**: Track when password was last changed

### 8. Email Template

#### Existing Template Reuse
**Assumption**: Use Phase 13 verification email template
```typescript
await notificationService.sendVerificationCode({
  email: customer.email,
  code,
  type: 'password_reset',
  expiryMinutes: 15
});
```

**Email Contents**:
- Subject: "Password Reset Verification Code"
- Title: "Reset Your Password"
- 6-digit code displayed in monospace with letter spacing
- Expiration warning (15 minutes)
- Security notice: "If you didn't request this..."

**Rationale**: Template already exists in notification.service.ts

### 9. Token Generation

#### JWT Token After Reset
**Assumption**: Auto-login user after successful password reset
```typescript
const token = generateToken({
  userId: customer.id,
  email: customer.email,
  role: 'customer',
  customerId: customer.id,
});

res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

**Rationale**: Better UX - user doesn't need to log in after reset

### 10. Logging & Monitoring

#### Security Event Logging
**Assumption**: Log all password reset activities
- Forgot-password requests (both valid and invalid emails)
- Code validation attempts (success and failure)
- Successful password resets
- Rate limit violations
- Max attempt lockouts

**Log Format** (using existing logger utility):
```typescript
logger.info('Password reset requested', { email, ipAddress });
logger.warn('Password reset attempt for non-existent email', { email, ip });
logger.info('Password reset successful', { email, userId });
logger.error('Password reset failed - invalid code', { email, attempts });
```

**Rationale**: Security audit trail without exposing sensitive data

### 11. IP Address Tracking

#### Verification Code IP Storage
**Assumption**: Store requester IP for security tracking
```typescript
await verificationCodeService.createCode({
  email: customer.email,
  type: 'password_reset',
  ipAddress: req.ip,  // Express req.ip
  expiryMinutes: 15
});
```

**Purpose**:
- Detect suspicious patterns (multiple emails from same IP)
- Future enhancement: geographic validation
- Audit trail for security investigations

**Rationale**: Already supported by Phase 13 schema

### 12. Response Data Structure

#### Success Response Format
**Assumption**: Consistent with existing auth endpoints
```typescript
// forgot-password
sendSuccess(res, {
  message: 'If an account exists, a verification code has been sent to your email'
});

// verify-reset-code
sendSuccess(res, {
  valid: true
});

// reset-password
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
```

**Rationale**: Matches apps/api/src/routes/auth.routes.ts response patterns

### 13. Testing Approach

#### Test Coverage Deferred
**Assumption**: Full test implementation in Phase 22
- Document test scenarios in test files
- Use `it.todo()` placeholders
- Focus on implementation quality during Phase 14

**Test Scenarios to Document**:
- Rate limiting enforcement (3/hour for verification)
- Email validation and sanitization
- Code generation and expiration
- Max attempts enforcement (3 attempts)
- Password strength validation
- Weak password rejection
- Successful password reset flow
- Token generation and cookie setting
- No user enumeration in responses
- Code invalidation after successful reset

**Rationale**: Consistent with Phase 13 approach

### 14. Middleware Security Stack

#### XSS Protection
**Assumption**: Apply XSS sanitization to all endpoints
```typescript
import { xssSanitize } from '../middleware/xss';
```

**Purpose**: Strip HTML tags and prevent script injection

**Rationale**: Defense-in-depth security

#### CSRF Protection
**Assumption**: CSRF token NOT required for password reset
- Password reset is public endpoint (no authentication)
- Rate limiting provides abuse protection
- Email verification provides authorization
- CSRF is for authenticated state-changing operations

**Rationale**: Password reset doesn't require session

### 15. Edge Cases & Error Scenarios

#### Edge Case 1: Multiple Reset Requests
**Behavior**: Each new request invalidates previous codes
- User requests reset → Code A created
- User requests again → Code A marked as used, Code B created
- Only Code B is valid

**Rationale**: verificationCodeService.createCode() auto-invalidates

#### Edge Case 2: Guest Account Password Reset
**Assumption**: Guest accounts (isGuest=true) cannot reset password
- Check `customer.isGuest` flag
- Return generic error (no enumeration)
- Log attempt for security monitoring

**Rationale**: Guest accounts don't have passwords

#### Edge Case 3: Inactive Account
**Assumption**: Inactive accounts (isActive=false) cannot reset password
- Check `customer.isActive` flag
- Return generic error
- Log attempt

**Rationale**: Prevent reactivation via password reset

#### Edge Case 4: Case-Insensitive Email
**Assumption**: Email matching is case-insensitive
```typescript
email.toLowerCase()
```

**Rationale**: Prevents user confusion (User@example.com vs user@example.com)

#### Edge Case 5: Concurrent Validation Attempts
**Assumption**: Database handles attempt counter atomically
- Drizzle ORM update increments attempts
- No race condition with max attempts check
- First to exceed max attempts triggers lockout

**Rationale**: PostgreSQL atomic operations

### 16. Environment Variables

#### No New Variables Required
**Assumption**: Reuse existing configuration
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing
- `JWT_EXPIRES_IN` - Token expiration (7d)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email sending
- `COMPANY_NAME` - Email branding
- `NODE_ENV` - Environment detection

**Rationale**: All infrastructure already configured

### 17. File Organization

#### Files to Modify
**Assumption**: Single-file changes for clean git history
1. `apps/api/src/routes/auth.routes.ts` - Add 3 endpoints
2. Create test file: `apps/api/src/routes/__tests__/auth.routes.password-reset.test.ts`

**No New Services**: Reuse existing services
- verificationCodeService (Phase 13)
- notificationService (Phase 13)
- mailerService (existing)

**Rationale**: Minimal changes, maximum reuse

### 18. Import Dependencies

#### Required Imports for auth.routes.ts
```typescript
// Existing imports (already present)
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getDb, customers, eq } from '@lab404/database';
import { validateBody } from '../middleware/validator';
import { sendSuccess, sendError } from '../utils/response';
import { BadRequestError, ValidationError, TooManyRequestsError } from '../utils/errors';
import { generateToken, getTokenExpiration } from '../middleware/auth';
import { logger } from '../utils/logger';

// New imports needed
import { verificationCodeService } from '../services';
import { notificationService } from '../services/notification.service';
import { verificationLimiter, authLimiter } from '../middleware/rateLimiter';
import { xssSanitize } from '../middleware/xss';
import { sanitizeEmail, isStrongPassword, WEAK_PASSWORDS } from '../utils/validation';
```

**Rationale**: All utilities already exist

### 19. Code Invalidation Strategy

#### Automatic Invalidation Points
**Assumption**: Codes are invalidated at these points
1. **New code creation**: Previous unused codes auto-invalidated
2. **Successful password reset**: All codes for email/type marked as used
3. **Max attempts reached**: Code remains but becomes unusable
4. **Expiration**: Code expires after 15 minutes
5. **Cleanup cron**: Codes >24 hours deleted

**Rationale**: Multi-layered security, prevent code reuse

### 20. Response Timing

#### Constant-Time Responses
**Assumption**: Prevent timing attacks on email existence
```typescript
// For forgot-password endpoint
const customer = await findCustomerByEmail(email);

if (!customer) {
  // Simulate same operations for timing consistency
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  logger.info('Password reset attempt for non-existent email', { email });
}

// Always return same response
sendSuccess(res, { message: '...' });
```

**Rationale**: Security best practice to prevent enumeration via timing

### 21. Password History

#### No Password History Check (This Phase)
**Assumption**: Don't prevent password reuse in Phase 14
- User can reset to same password
- Password history feature deferred to Phase 19 (Advanced Password Security)

**Rationale**: Keep Phase 14 focused, enhance later

### 22. Account Lockout

#### No Account Lockout (This Phase)
**Assumption**: Code max attempts ≠ account lockout
- Max 3 attempts per verification code
- User can request new code (subject to rate limiting)
- Account lockout feature in Phase 21 (Rate Limiting & Abuse Prevention)

**Rationale**: Graceful degradation, user can recover

### 23. Email Delivery Failure

#### Graceful Degradation
**Assumption**: Don't reveal email sending failure to user
```typescript
const emailSent = await notificationService.sendVerificationCode(...);

if (!emailSent) {
  logger.error('Failed to send password reset email', { email, code });
  // Still return success to user (no enumeration)
}

sendSuccess(res, { message: '...' });
```

**Rationale**: Security over UX transparency

### 24. Database Transaction Requirements

#### No Transactions Needed (Single Operations)
**Assumption**: Each database operation is atomic
- Code creation: Single insert
- Code validation: Single update (increment attempts)
- Password reset: Single update (passwordHash)
- Code invalidation: Single update (mark as used)

**Rationale**: Simple operations, no multi-step consistency needed

### 25. API Versioning

#### No API Versioning (Current State)
**Assumption**: Endpoints at `/api/auth/*` without version prefix
- Future versioning not required for MVP
- Breaking changes handled via deprecation (if needed later)

**Rationale**: Matches existing API structure

### 26. CORS Configuration

#### No CORS Changes Required
**Assumption**: Existing CORS configuration supports password reset
- Frontend and API on same domain (monorepo)
- No cross-origin requests needed
- Credentials (cookies) sent automatically

**Rationale**: Existing middleware handles CORS

### 27. HTTP Methods

#### POST for All Endpoints
**Assumption**: Use POST for all 3 password reset endpoints
- POST /api/auth/forgot-password
- POST /api/auth/verify-reset-code
- POST /api/auth/reset-password

**Rationale**: State-changing operations, sensitive data in body

### 28. Content-Type

#### JSON Request/Response
**Assumption**: application/json for all endpoints
```typescript
// Express JSON middleware already configured
app.use(express.json());
```

**Rationale**: Consistent with existing auth endpoints

### 29. Success Status Codes

#### Always 200 OK
**Assumption**: Use 200 for all successful responses
- forgot-password: 200 (even if email doesn't exist)
- verify-reset-code: 200 (valid code)
- reset-password: 200 (password updated)

**Not using**:
- 201 Created (not creating resources)
- 204 No Content (always return data)

**Rationale**: Simplicity, consistency, security

### 30. Customer Active Status

#### Active Flag Enforcement
**Assumption**: Only active customers can reset passwords
```typescript
if (customer && !customer.isActive) {
  logger.warn('Password reset attempt for inactive account', { email });
  // Return generic error (no enumeration)
  sendSuccess(res, { message: '...' });
  return;
}
```

**Rationale**: Prevent account reactivation via password reset

### 31. Guest Account Handling

#### Guest Exclusion
**Assumption**: Guest accounts excluded from password reset
```typescript
if (customer && customer.isGuest) {
  logger.warn('Password reset attempt for guest account', { email });
  // Return generic error
  sendSuccess(res, { message: '...' });
  return;
}
```

**Rationale**: Guests don't have passwords (OAuth or temporary)

### 32. Code Type Isolation

#### Strict Type Checking
**Assumption**: Only 'password_reset' codes accepted
```typescript
await verificationCodeService.validateCode({
  email,
  code,
  type: 'password_reset'  // Must match
});
```

**Prevents**: Using email_verification code for password reset

**Rationale**: Type isolation prevents cross-feature exploits

### 33. UTF-8 Encoding

#### Unicode Password Support
**Assumption**: Support international characters in passwords
- bcrypt handles UTF-8 natively
- No ASCII-only restriction
- Validate length after encoding (not character count)

**Rationale**: Inclusive, modern standard

### 34. Null Password Hash Handling

#### Defensive Checks
**Assumption**: Some customers might have null passwordHash
```typescript
if (!customer.passwordHash) {
  logger.error('Customer has no password hash', { customerId: customer.id });
  // Treat as invalid state, return generic error
}
```

**Scenarios**:
- OAuth-only accounts
- Data migration issues
- Guest accounts

**Rationale**: Defensive programming

### 35. Email Template Language

#### English Only (This Phase)
**Assumption**: All emails sent in English
- No i18n/localization
- Hardcoded email copy
- Internationalization deferred to future enhancement

**Rationale**: MVP scope, English-speaking target market

### 36. Timezone Handling

#### UTC for All Timestamps
**Assumption**: Server operates in UTC
```typescript
expiresAt: new Date()  // UTC timestamp
```

**Email Display**: Show relative time (e.g., "15 minutes") not absolute

**Rationale**: Avoid timezone confusion

### 37. Code Display Format

#### Plain 6-Digit String
**Assumption**: Send code as-is (e.g., "123456")
- No hyphens: "123-456" ❌
- No spaces: "123 456" ❌
- No formatting: Just "123456" ✅

**Frontend Responsibility**: Add spacing/formatting for display

**Rationale**: Simplicity, copy-paste friendly

### 38. Multiple Concurrent Sessions

#### Allow Multiple Active Tokens
**Assumption**: New password reset doesn't invalidate other sessions
- User can be logged in on multiple devices
- Password reset creates NEW token
- Old tokens remain valid until expiry

**Rationale**: Convenience, old sessions auto-expire anyway

**Note**: Session management improvements in Phase 18

### 39. Password Change Notification

#### No Email Notification (This Phase)
**Assumption**: Don't send "password changed" confirmation email
- User receives only verification code email
- Post-reset notification deferred to Phase 16 (Security Email Templates)

**Rationale**: Keep Phase 14 focused

### 40. Admin Password Reset

#### Customer-Only Feature
**Assumption**: Admin users use separate password reset (if needed)
- These endpoints only for customer accounts
- Admin password reset (if required) added in later phase
- Admin accounts managed differently

**Rationale**: Customer-facing feature first

### 41. Mobile App Support

#### API-Only, Frontend Agnostic
**Assumption**: Endpoints work for both web and mobile
- No platform-specific logic
- Return JSON data (not HTML)
- Frontend handles UI/UX

**Rationale**: API-first design

### 42. Rate Limit Headers

#### Standard Rate Limit Headers
**Assumption**: express-rate-limit adds standard headers automatically
```
RateLimit-Limit: 3
RateLimit-Remaining: 2
RateLimit-Reset: 1641024000
```

**Rationale**: Client can display countdown

### 43. Retry-After Header

#### Return Retry-After on 429
**Assumption**: Rate limiter includes Retry-After header
```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
```

**Rationale**: Client knows when to retry

### 44. Health Check Impact

#### No Health Check Endpoint
**Assumption**: Password reset doesn't affect /health endpoint
- Health check remains independent
- No new metrics added

**Rationale**: Separation of concerns

### 45. Feature Flag

#### No Feature Flag Required
**Assumption**: Deploy password reset as always-enabled
- No gradual rollout needed
- No A/B testing
- Launch to all users simultaneously

**Rationale**: Core security feature, not experimental

### 46. Backwards Compatibility

#### No Breaking Changes
**Assumption**: New endpoints don't affect existing auth
- /login endpoint unchanged
- /register endpoint unchanged
- Existing auth flows continue working

**Rationale**: Additive feature

### 47. Frontend Routes

#### No Frontend Changes in Phase 14
**Assumption**: Backend-only phase
- Frontend password reset UI in Phase 15
- API endpoints ready first
- Can test with Postman/cURL

**Rationale**: Phased approach, backend foundation first

### 48. Database Indexes

#### Existing Indexes Sufficient
**Assumption**: Phase 13 indexes cover password reset needs
```sql
CREATE INDEX verification_codes_email_idx ON verification_codes(email);
CREATE INDEX verification_codes_expires_at_idx ON verification_codes(expires_at);
```

**Query Optimization**: Email lookups are indexed

**Rationale**: No new indexes needed

### 49. Analytics & Metrics

#### Basic Logging Only
**Assumption**: Log events, no advanced analytics
- Log to console/file via logger utility
- No metrics dashboard
- No analytics events
- Advanced monitoring in Phase 20 (Security Audit Logging)

**Rationale**: Keep Phase 14 simple

### 50. Compliance & Legal

#### No GDPR/Privacy Concerns
**Assumption**: Password reset doesn't create new data privacy requirements
- Verification codes deleted after 24 hours
- Emails already in database
- No new PII collected
- IP addresses stored temporarily for security

**Rationale**: Existing data handling policies apply

### 51. Documentation

#### API Documentation Deferred
**Assumption**: No formal API docs (Swagger/OpenAPI) in Phase 14
- Code comments sufficient for now
- API documentation project in future phase
- Endpoints self-documenting via TypeScript types

**Rationale**: Focus on implementation quality

---

## Assumptions Summary

**Total Assumptions**: 51

**Categories**:
- Infrastructure & Dependencies: 7 assumptions
- Security & Privacy: 14 assumptions
- API Design & Implementation: 12 assumptions
- Error Handling & Edge Cases: 9 assumptions
- Data & Validation: 6 assumptions
- Testing & Quality: 3 assumptions

**High-Risk Assumptions** (require validation):
1. Guest account password reset exclusion (assumption #31)
2. No password history checking (assumption #21)
3. Constant-time responses for timing attack prevention (assumption #20)
4. No "password changed" confirmation email (assumption #39)

**Dependencies**:
- Phase 13 must be 100% complete ✅
- No frontend changes required ✅
- No new environment variables ✅
- No database migrations ✅

**Deferred to Future Phases**:
- Password history tracking → Phase 19
- Password change notification emails → Phase 16
- Account lockout system → Phase 21
- Comprehensive security testing → Phase 22
- Session management improvements → Phase 18
