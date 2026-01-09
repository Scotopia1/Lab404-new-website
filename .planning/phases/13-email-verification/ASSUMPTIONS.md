# Phase 13: Email Verification Code System - Implementation Assumptions

**Created:** 2026-01-09
**Phase:** 13 - Email Verification Code System
**Status:** Pre-Implementation

---

## Overview

This document outlines the assumptions and decisions made for implementing the email verification code system, which serves as the foundation for password reset (Phase 14) and email verification (Phase 17) features.

---

## Database Assumptions

### Schema Design

**Assumption 1: Single Table for All Code Types**
- Use one `verification_codes` table with a `type` enum to handle multiple use cases
- Types: `password_reset`, `email_verification`, `account_unlock`
- **Rationale**: Simpler to maintain, consistent cleanup logic, shared validation patterns
- **Alternative**: Separate tables per type (rejected: unnecessary complexity)

**Assumption 2: Plaintext Code Storage**
- Store 6-digit codes as plaintext VARCHAR(6)
- **Rationale**: Codes must be emailed to users, hashing defeats the purpose
- **Security**: Short TTL (15 min), single-use, max attempts (3), cleanup jobs
- **Alternative**: Hash codes (rejected: cannot send to user)

**Assumption 3: Timestamp-Based Expiration**
- Use `expiresAt` timestamp field (15 minutes from creation)
- **Rationale**: Follows existing patterns in `promoCodes` and `quotations` tables
- **Alternative**: TTL column (rejected: less explicit, harder to query)

**Assumption 4: Soft Delete (isUsed Flag)**
- Use `isUsed` boolean instead of hard deletion on use
- **Rationale**: Maintains audit trail, enables analytics, prevents timing attacks
- **Cleanup**: Cron job removes used/expired codes after 24 hours

### Field Decisions

**email Field**
- VARCHAR(255), NOT NULL
- Store as lowercase for consistency
- Indexed for fast lookups
- **Assumption**: Email is the primary identifier (no user ID needed)

**code Field**
- VARCHAR(6), NOT NULL
- 6-digit numeric (000000-999999)
- **Assumption**: 6 digits provides sufficient entropy for 15-minute window
- **Math**: 1,000,000 combinations / 15 min = ~66,666 combinations/min (secure enough)

**attempts Field**
- INTEGER, DEFAULT 0
- Tracks validation attempts
- **Assumption**: Track per code, not per email (prevents cross-code brute force)

**ipAddress Field**
- VARCHAR(45), NULLABLE (IPv6 compatible)
- **Assumption**: Optional for v2.0, enables future geo-blocking or suspicious activity detection
- **Privacy**: Stored only for active codes, deleted with cleanup

---

## Code Generation Assumptions

### Cryptographic Security

**Assumption 5: crypto.randomInt() is Sufficient**
- Use Node.js `crypto.randomInt(0, 1000000)` for code generation
- **Rationale**:
  - Cryptographically secure (CSPRNG)
  - Native Node.js module (no dependencies)
  - Simple, readable, maintainable
- **Alternative**: crypto.randomBytes with modulo (rejected: overkill)

**Assumption 6: Leading Zeros Matter**
- Pad codes to 6 digits: `123` → `000123`
- **Rationale**: Consistent UX, easier to read, avoids confusion
- **Implementation**: `code.toString().padStart(6, '0')`

**Assumption 7: No Code Reuse Check**
- Do not check for duplicate codes in database before insertion
- **Rationale**:
  - 1 in 1,000,000 collision chance per code
  - 15-minute TTL makes collision window tiny
  - Database unique constraint would fail anyway (acceptable)
- **Alternative**: Check for duplicates (rejected: unnecessary overhead)

---

## Expiration & TTL Assumptions

### Time Window

**Assumption 8: 15-Minute Fixed Expiration**
- All codes expire 15 minutes after creation
- Not configurable per request (simplifies logic)
- **Rationale**: User requirement, standard industry practice
- **Edge Case**: If user's clock is wrong, code may appear expired early (acceptable)

**Assumption 9: Server Time is Source of Truth**
- Use `new Date()` on server for all timestamp comparisons
- **Rationale**: Prevents client-side time manipulation
- **Consideration**: Assumes server clock is accurate (NTP sync recommended)

**Assumption 10: No Grace Period**
- Codes expire exactly at `expiresAt` timestamp
- No 1-minute grace period
- **Rationale**: 15 minutes is generous, grace period adds complexity

---

## Rate Limiting Assumptions

### Request Limits

**Assumption 11: Rate Limit by Email**
- 3 code generation requests per hour per email
- Use existing `express-rate-limit` middleware
- **Rationale**: Prevents abuse, user requirement
- **Key**: Email address from request body
- **Fallback**: IP address if email not provided

**Assumption 12: Separate Limits for Generation vs Validation**
- Generation: 3 per hour per email (rate limiter)
- Validation: 3 per code (database field)
- **Rationale**: Different attack vectors, different limits

**Assumption 13: In-Memory Rate Limiting is Acceptable**
- Use default `express-rate-limit` in-memory store
- **Rationale**: MVP acceptable, single-server deployment
- **Production Consideration**: Add Redis store for multi-server setups (future)

### Validation Attempts

**Assumption 14: 3 Attempts Per Code**
- Each code allows 3 validation attempts
- Stored in `attempts` field
- **Rationale**: Prevents brute force, user requirement
- **Edge Case**: User typos twice, gets locked out (acceptable: request new code)

**Assumption 15: Attempts Reset on New Code**
- Generating a new code invalidates old codes (sets `isUsed = true`)
- **Rationale**: Prevents confusion, users always use latest code
- **Implementation**: Invalidate previous codes when creating new one

---

## Validation Logic Assumptions

### Security Model

**Assumption 16: Constant-Time Comparison Not Required**
- Use simple string equality: `record.code !== code`
- **Rationale**:
  - 6-digit numeric codes have uniform length
  - 15-minute TTL limits attack window
  - Timing attacks require thousands of attempts (rate limited)
- **Alternative**: Use `crypto.timingSafeEqual()` (rejected: overkill for this use case)

**Assumption 17: Email is Case-Insensitive**
- Store and compare emails as lowercase: `email.toLowerCase()`
- **Rationale**: Standard email practice (RFC 5321 allows case-insensitivity)

**Assumption 18: Type Must Match**
- Code type (`password_reset`, `email_verification`) must match request
- **Rationale**: Prevents code reuse across different features
- **Example**: Cannot use password reset code for email verification

### One-Time Use

**Assumption 19: Codes are Single-Use**
- Mark `isUsed = true` immediately on successful validation
- **Rationale**: Security best practice, prevents replay attacks
- **Database**: Use `usedAt` timestamp for audit trail

**Assumption 20: Multiple Active Codes Allowed (But Discouraged)**
- No hard limit on active codes per email
- Latest code is used, old codes remain valid until expiry
- **Rationale**: Edge case handling (user clicks "resend" multiple times)
- **Mitigation**: Invalidate old codes when creating new one (Assumption 15)

---

## Cleanup Service Assumptions

### Cron Job Pattern

**Assumption 21: Cron Job for Cleanup**
- Use Express endpoint: `POST /api/cron/cleanup-verification-codes`
- Follows existing pattern in `cron.routes.ts`
- **Rationale**: Consistency with existing codebase
- **Alternative**: Database triggers (rejected: harder to monitor/debug)

**Assumption 22: 24-Hour Retention**
- Delete codes that are:
  - Expired for >24 hours, OR
  - Used and `usedAt` >24 hours ago
- **Rationale**: Maintains audit trail for recent activity, prevents table bloat
- **Alternative**: Delete immediately on use (rejected: loses audit trail)

**Assumption 23: Every 6 Hours Cleanup**
- Run cleanup job every 6 hours
- **Rationale**: Balance between DB size and overhead
- **Implementation**: Vercel Cron, GitHub Actions, or external cron service

### Cleanup Query

**Assumption 24: Soft Delete Strategy**
- Use hard DELETE, not soft delete with `deletedAt` field
- **Rationale**: No need to track deleted codes long-term, saves storage
- **Audit**: Recent activity is logged elsewhere (Phase 20: Security Audit Logging)

---

## Email Integration Assumptions

### Email Delivery

**Assumption 25: Existing Email Infrastructure**
- Use `mailerService` and `emailTemplatesService` from v1.0
- **Rationale**: Already tested, working, consistent branding
- **No new dependencies needed**

**Assumption 26: Email Failures are Non-Blocking**
- If email fails to send, code is still created in database
- Return error to user: "Could not send email, please try again"
- **Rationale**: Separates concerns, allows manual retry
- **Alternative**: Roll back code creation (rejected: transaction complexity)

**Assumption 27: No SMS Support in v2.0**
- Email-only verification codes
- **Rationale**: User requirement didn't mention SMS, adds complexity
- **Future**: Phase 23+ if needed

### Email Template

**Assumption 28: Branded HTML Email**
- Use existing `wrapCustomerTemplate()` method
- Large, centered code display (32px font, letter-spacing)
- Red warning text for expiry (15 minutes)
- **Rationale**: Consistent with existing email design
- **Accessibility**: Plain text fallback included

**Assumption 29: No Code Obfuscation**
- Display full 6-digit code in email (not partially hidden)
- **Rationale**: User needs to copy code accurately
- **Security**: Email is already a trusted channel (password reset confirmation)

---

## Error Handling Assumptions

### User-Facing Errors

**Assumption 30: Generic Error Messages for Security**
- "Invalid or expired verification code" (don't reveal which)
- **Rationale**: Prevents enumeration attacks
- **Alternative**: Specific errors (rejected: leaks info to attackers)

**Assumption 31: Different Error for Max Attempts**
- "Maximum verification attempts exceeded"
- **Rationale**: Helps legitimate users understand why code was rejected
- **UX**: Prompt user to request a new code

### Logging

**Assumption 32: Log All Verification Events**
- Log code generation (email, type, timestamp)
- Log validation attempts (success/failure)
- Use existing `logger` utility
- **Rationale**: Security monitoring, debugging, analytics
- **Privacy**: Log email (needed for support), log IP (optional)

---

## Testing Assumptions

### Test Coverage

**Assumption 33: Unit Tests for Code Generation**
- Test format (6 digits, numeric only)
- Test randomness (not sequential)
- Test padding (leading zeros)
- **Tooling**: Jest (already in project)

**Assumption 34: Integration Tests for Service**
- Test code creation, validation, expiration
- Test rate limiting behavior
- Test cleanup job
- **Database**: Use test database or in-memory SQLite

**Assumption 35: Manual Testing Required**
- Email rendering (send to real inbox)
- End-to-end flow (request code → receive email → validate)
- **Rationale**: Some things can't be automated easily

---

## Performance Assumptions

### Database Performance

**Assumption 36: Indexes Required**
- Index on `email` (frequent lookups)
- Index on `expiresAt` (cleanup queries)
- **Rationale**: Fast queries, especially for validation (time-sensitive)

**Assumption 37: Table Size is Manageable**
- Estimate: ~1,000 codes/day × 2-day retention = ~2,000 rows max
- **Rationale**: Regular cleanup prevents bloat, queries remain fast
- **Monitoring**: Track table size in production

### Service Performance

**Assumption 38: Synchronous Code Generation**
- No async/await for `crypto.randomInt()`
- **Rationale**: Synchronous crypto operations are fast (<1ms)

**Assumption 39: Database Queries are Optimized**
- Use indexed lookups
- Limit results (`.limit(1)`)
- Order by `createdAt DESC` to get latest code
- **Rationale**: Validation must be fast (<50ms)

---

## Migration Assumptions

### Drizzle ORM

**Assumption 40: Drizzle Generate + Push**
- Use `drizzle-kit generate` to create migration
- Use `drizzle-kit push` to apply (or manual `migrate`)
- **Rationale**: Follows existing migration workflow

**Assumption 41: No Data Migration Needed**
- New table, no existing data to migrate
- **Rationale**: Clean slate for v2.0

---

## Integration Assumptions

### API Endpoints (Phase 14)

**Assumption 42: Service is Foundation Only**
- Phase 13 creates service, no API endpoints yet
- **Rationale**: Phase 14 will create password reset endpoints
- **Exports**: Service exported from `services/index.ts` for use by Phase 14

**Assumption 43: Rate Limiter is Middleware**
- Create `verificationLimiter` middleware
- Export from `middleware/index.ts`
- **Usage**: Phase 14 will apply to password reset endpoints

---

## Security Assumptions

### Threat Model

**Assumption 44: Brute Force is Primary Threat**
- Mitigation: 3 attempts per code, 15-min expiry, rate limiting
- **Acceptable Risk**: 1,000 emails × 3 attempts = 3,000 guesses (0.3% success rate)

**Assumption 45: Email Interception is Out of Scope**
- Assume email is a secure channel (TLS in transit)
- **Rationale**: Standard industry practice for password resets
- **Note**: 2FA with app-based codes (Phase 23+) would mitigate

**Assumption 46: No CAPTCHA in v2.0**
- Rate limiting is sufficient
- **Rationale**: Avoids UX friction, complexity
- **Future**: Add CAPTCHA if abuse detected (Phase 21+)

---

## Dependency Assumptions

### No New Packages

**Assumption 47: Use Existing Dependencies Only**
- All required packages already installed:
  - `crypto` (Node.js built-in)
  - `drizzle-orm` (0.36.0)
  - `express-rate-limit` (7.4.0)
  - `nodemailer` (6.10.1)
  - `zod` (3.23.0)
- **Rationale**: Reduces attack surface, no version conflicts

---

## Rollout Assumptions

### Deployment

**Assumption 48: Feature Flag Not Required**
- Phase 13 is foundation only, no user-facing changes
- **Rationale**: Service won't be called until Phase 14 endpoints are created

**Assumption 49: Database Migration Before Code Deploy**
- Apply migration, then deploy code
- **Rationale**: Code expects table to exist, fails if missing

---

## Future Considerations

### Assumptions for Later Phases

**Assumption 50: Session Management (Phase 18) is Separate**
- Verification codes are stateless, independent of sessions
- **Rationale**: Can be used before login (password reset) or during login (email verification)

**Assumption 51: Audit Logging (Phase 20) Will Enhance Tracking**
- Phase 13 uses basic `logger.info()`
- Phase 20 will add structured audit logs
- **Rationale**: Phase 13 focuses on core functionality, Phase 20 on observability

---

## Risk Assessment

### Known Risks

**Risk 1: Email Delivery Failures**
- **Likelihood**: Medium (spam filters, SMTP issues)
- **Impact**: High (users can't reset password)
- **Mitigation**: Monitor email bounce rates, provide support contact

**Risk 2: Time Zone Issues**
- **Likelihood**: Low (server uses UTC)
- **Impact**: Medium (codes expire early/late)
- **Mitigation**: All timestamps in UTC, document server time requirements

**Risk 3: Rate Limit False Positives**
- **Likelihood**: Low (3 attempts/hour is generous)
- **Impact**: Medium (users locked out temporarily)
- **Mitigation**: Clear error messages, 1-hour cooldown is acceptable

---

## Assumptions Summary

**Total Assumptions**: 51

**Categories**:
- Database: 10 assumptions
- Code Generation: 7 assumptions
- Expiration/TTL: 3 assumptions
- Rate Limiting: 5 assumptions
- Validation: 6 assumptions
- Cleanup: 4 assumptions
- Email: 5 assumptions
- Error Handling: 2 assumptions
- Testing: 3 assumptions
- Performance: 4 assumptions
- Security: 3 assumptions
- Other: 5 assumptions

**Validation**: These assumptions are based on:
- Research of existing codebase patterns
- Security best practices (OWASP)
- User requirements (6-digit codes, 15-min expiry, 3 attempts)
- Industry standards (password reset flows)

---

*Created: 2026-01-09*
*Last Updated: 2026-01-09*
*Phase: 13 - Email Verification Code System*
