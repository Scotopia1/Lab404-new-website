# Phase 19: Advanced Password Security - Implementation Assumptions

## Phase Overview
Implement enterprise-grade password security including breach detection via Have I Been Pwned API, password history tracking, account lockout mechanisms, password strength meters, and comprehensive security guidance.

## Critical Assumptions

### 1. Current Password Security Foundation
**Assumption**: Build on existing bcrypt implementation (Phase 14)

- ✅ Bcrypt hashing with 12 rounds
- ✅ Password strength validation (uppercase, lowercase, numbers, 8+ chars)
- ✅ Weak password list (20 common passwords blocked)
- ✅ Rate limiting on auth endpoints (5 attempts/15min)
- ✅ Password change endpoint exists (PUT /customers/me/password)
- ✅ Session tracking operational (Phase 18)

**Rationale**: Extend existing security, don't rebuild

### 2. HIBP Integration Strategy
**Assumption**: Use Have I Been Pwned API with k-anonymity model (free tier)

**API Endpoint**: `https://api.pwnedpasswords.com/range/{first5}`
**Method**: k-anonymity (send first 5 SHA-1 hash chars only)
**Cost**: Free tier (no API key required)
**Rate Limit**: Not specified by HIBP, implement local rate limiting

**Implementation**:
```typescript
1. Hash password with SHA-1
2. Take first 5 characters of hash
3. Send to HIBP API: GET /range/{first5}
4. Receive list of hash suffixes and counts
5. Check if full hash suffix matches locally
6. Password never sent to HIBP
```

**Rationale**: Privacy-preserving, free, industry standard

### 3. Database Schema - Password History
**Assumption**: Store last 10 password hashes to prevent reuse

**New Table**: `password_history`
```sql
id                UUID PRIMARY KEY
customer_id       UUID REFERENCES customers
password_hash     VARCHAR(255) NOT NULL
set_at            TIMESTAMP NOT NULL
changed_at        TIMESTAMP
change_reason     VARCHAR(100)  -- user_action, admin_reset, breach_recovery
expires_at        TIMESTAMP
ip_address        VARCHAR(45)
user_agent        TEXT
created_at        TIMESTAMP NOT NULL
```

**Retention**: Keep last 10 passwords indefinitely
**Comparison**: Use bcrypt.compare() against history

**Rationale**: Prevent password cycling, NIST SP 800-63B compliance

### 4. Database Schema - Login Attempts
**Assumption**: Track failed login attempts for lockout mechanism

**New Table**: `login_attempts`
```sql
id                UUID PRIMARY KEY
email             VARCHAR(255) NOT NULL
customer_id       UUID REFERENCES customers
success           BOOLEAN NOT NULL
attempt_count     INTEGER DEFAULT 1
last_attempt      TIMESTAMP NOT NULL
is_locked         BOOLEAN DEFAULT FALSE
locked_until      TIMESTAMP
lock_reason       VARCHAR(100)
ip_address        VARCHAR(45) NOT NULL
user_agent        TEXT
last_error        VARCHAR(255)
created_at        TIMESTAMP NOT NULL
updated_at        TIMESTAMP NOT NULL
```

**Indexes**: email, customer_id, is_locked, last_attempt

**Rationale**: Per-account lockout tracking

### 5. Database Schema - Breach Checks
**Assumption**: Cache HIBP results for 30 days

**New Table**: `breach_checks`
```sql
id                UUID PRIMARY KEY
customer_id       UUID REFERENCES customers
password_hash     VARCHAR(255) NOT NULL
is_breached       BOOLEAN DEFAULT FALSE
breach_count      INTEGER DEFAULT 0
breach_sources    JSONB
user_notified     BOOLEAN DEFAULT FALSE
notified_at       TIMESTAMP
last_checked_at   TIMESTAMP NOT NULL
expires_at        TIMESTAMP
api_calls         INTEGER DEFAULT 0
last_api_error    VARCHAR(255)
created_at        TIMESTAMP NOT NULL
updated_at        TIMESTAMP NOT NULL
```

**Cache Duration**: 30 days
**Re-check**: After cache expiration

**Rationale**: Reduce API calls, improve performance

### 6. Account Lockout Policy
**Assumption**: Progressive lockout after failed attempts

**Configuration**:
- Failed attempts threshold: 5
- Lockout duration: 15 minutes (first lockout)
- Progressive: 15min → 30min → 1hr → 24hr
- Reset window: 24 hours of no failed attempts
- Admin unlock: Available via support

**Progression**:
```
Attempts 1-4: Generic error
Attempt 5: Lock for 15 minutes
Attempt 6-9: Lock for 30 minutes each
Attempt 10+: Lock for 1 hour, alert admin
```

**Rationale**: Balance security with user experience

### 7. Password Strength Calculation
**Assumption**: Use zxcvbn library for strength scoring

**Library**: `zxcvbn` v4.4.2
- Industry standard (Dropbox, 1Password use it)
- MIT license
- Size: ~400KB (tree-shaken to ~100KB)
- Returns score 0-4 and detailed feedback

**Score Mapping**:
```
0: Very Weak (< 1 second to crack)
1: Weak (< 1 day)
2: Fair (< 1 month)
3: Good (< 1 year)
4: Strong (> 1 year)
```

**Alternative Considered**: Custom entropy calculator
**Decision**: zxcvbn (proven, comprehensive)

**Rationale**: Industry-standard library, accurate feedback

### 8. Password History Enforcement
**Assumption**: Prevent reuse of last 10 passwords

**Check Timing**: On password change attempt
**Method**: bcrypt.compare() against history (slow but secure)
**Performance**: ~10-20ms per comparison × 10 = ~200ms total (acceptable)

**Deferred**: Parallel bcrypt checking to Phase 20 (optimization)

**Rationale**: Security over performance for password changes

### 9. HIBP Check Timing
**Assumption**: Check password during validation, not during login

**When to Check**:
- ✅ Registration (new password)
- ✅ Password change
- ✅ Password reset
- ❌ Login (too slow, use cached result)

**Performance**: HIBP API ~100-500ms
**Handling**: Async check, don't block if API unavailable

**Rationale**: Don't slow down login, check at password set time

### 10. Password Breach Notification
**Assumption**: Email user if breach detected

**Notification Triggers**:
- Breach detected during password check
- Periodic re-checks find new breach (every 30 days)
- Admin-initiated breach scan

**Email Content**:
- Subject: "Security Alert: Password Breach Detected"
- Body: Explain breach, recommend change, link to change password
- CTA: "Change Password Now" button

**Deferred**: Real-time breach alerts to Phase 20

**Rationale**: Proactive security notification

### 11. Password Strength Meter UI
**Assumption**: Real-time feedback as user types

**Display**:
```
[████░░░░░░] Good (3/4)
✓ 12+ characters
✓ Uppercase letters
✓ Lowercase letters
✓ Numbers
✗ Special characters

Suggestions:
- Add special characters for maximum strength

Crack Time: ~6 months
```

**Update Frequency**: Debounced (300ms after typing stops)
**Location**: Registration, password change, password reset forms

**Rationale**: Immediate user feedback improves password quality

### 12. Login Attempt Tracking
**Assumption**: Record every login attempt (success and failure)

**Tracked Data**:
- Email (normalized lowercase)
- Customer ID (if found)
- Success/failure boolean
- IP address
- User-Agent
- Timestamp
- Error message (if failed)

**Retention**: 90 days
**Purpose**: Security audit, suspicious activity detection

**Rationale**: Comprehensive audit trail

### 13. Failed Login Rate Limiting
**Assumption**: Combine rate limiting with account lockout

**Current Rate Limit** (Phase 1): 5 requests/15 minutes (IP-based)
**New Account Lockout**: 5 failed attempts/account (email-based)

**Both Active**:
- Rate limit prevents brute force from single IP
- Account lockout prevents distributed brute force

**Rationale**: Defense in depth

### 14. Lockout Recovery Options
**Assumption**: Multiple recovery paths for locked accounts

**Options**:
1. Wait for lockout duration (automatic unlock)
2. Password reset via email (bypasses lockout)
3. Admin unlock (support ticket)
4. Account recovery codes (future: Phase 20)

**User Experience**:
- Clear countdown timer ("Try again in 12 minutes")
- "Forgot password?" link visible during lockout
- Support contact information

**Rationale**: User can always recover access

### 15. API Endpoint: Password Strength Check
**Assumption**: Pre-validation endpoint before submission

**Endpoint**: `POST /api/auth/password/check`
**Authentication**: Not required (public endpoint)
**Rate Limit**: 10 requests/minute per IP

**Request**:
```json
{ "password": "MyPassword123!" }
```

**Response**:
```json
{
  "score": 3,
  "strength": "good",
  "feedback": ["Add special characters"],
  "estimatedCrackTime": "6 months",
  "isBreached": false,
  "breachCount": 0
}
```

**Rationale**: Validate before form submission

### 16. API Endpoint: Login Attempt History
**Assumption**: Users can view their login history

**Endpoint**: `GET /api/customers/me/security/login-attempts`
**Authentication**: Required (requireAuth)
**Pagination**: Last 50 attempts

**Response**:
```json
{
  "attempts": [
    {
      "success": true,
      "device": "Chrome on Windows",
      "ipAddress": "192.168.1.1",
      "location": "San Francisco, CA",
      "timestamp": "2026-01-09T10:00:00Z"
    }
  ],
  "currentLockoutStatus": {
    "isLocked": false,
    "remainingTime": null
  }
}
```

**Rationale**: Transparency and security awareness

### 17. Admin Endpoint: Force Unlock
**Assumption**: Support can unlock accounts

**Endpoint**: `POST /api/admin/customers/:id/unlock`
**Authentication**: Admin only
**Logging**: Audit trail of all unlocks

**Use Cases**:
- Legitimate user locked out
- Account takeover false positive
- Emergency access needed

**Rationale**: Customer support capability

### 18. Password Expiration Feature
**Assumption**: Optional per-account setting (default: disabled)

**Configuration**:
```typescript
customers.enablePasswordExpiration: boolean (default: false)
customers.passwordExpirationDays: integer (default: 90)
customers.passwordChangedAt: timestamp
customers.passwordExpiresAt: timestamp
```

**Enforcement**: On login, check if password expired → force change
**Notification**: Email 7 days before expiration

**Deferred**: Forced expiration to Phase 20 (compliance feature)

**Rationale**: Enterprise customers may require periodic changes

### 19. Security Dashboard Page
**Assumption**: New frontend page for security management

**Route**: `/account/security/password`
**Parent**: `/account/security` (from Phase 18)

**Components**:
1. Password Status Card
   - Last changed: X days ago
   - Breach status: Safe/Warning
   - Strength score: 4/4
   - Next expiration: N/A (if disabled)

2. Login Activity Card
   - Recent successful logins
   - Failed attempts count
   - Suspicious activity alerts

3. Change Password Form
   - Current password
   - New password (with strength meter)
   - Breach check indicator

**Rationale**: Centralized security management

### 20. Frontend Password Strength Meter Component
**Assumption**: Reusable component for all password inputs

**Component**: `PasswordStrengthMeter.tsx`
**Props**:
```typescript
{
  password: string;
  onStrengthChange?: (score: number) => void;
  showSuggestions?: boolean;
  showBreachCheck?: boolean;
}
```

**Features**:
- Color-coded bar (red → green)
- Score display (0-4)
- Requirement checklist
- Real-time suggestions
- Breach warning (if applicable)
- Debounced API calls (300ms)

**Rationale**: Consistent UX across all forms

### 21. Weak Password List Expansion
**Assumption**: Expand from 20 to 100+ common passwords

**Current**: Hardcoded 20 passwords
**New**: 100+ most common passwords from breaches
**Source**: SecLists (top-100 passwords.txt)

**Alternative Considered**: Database table for passwords
**Decision**: Hardcoded array (faster, simpler)

**Rationale**: Catch more common weak passwords

### 22. HIBP API Error Handling
**Assumption**: Graceful degradation if API unavailable

**Scenarios**:
1. HIBP API timeout (>5 seconds)
2. HIBP API error (500, 503)
3. Network failure

**Fallback**:
- Log error
- Skip breach check (don't block password change)
- Use cached result if available
- Notify user: "Breach check unavailable, password accepted"
- Re-check on next password change

**Rationale**: Availability over perfect security

### 23. Password Change Email Notification
**Assumption**: Already implemented in Phase 16 (password changed confirmation)

**Existing**: `sendPasswordChangedConfirmation()` email
**Contains**: Timestamp, IP address, "If you didn't make this change" warning

**Enhancement**: Add breach status to email
```
✅ Password changed successfully
✅ New password not found in known breaches
```

**Rationale**: Reuse existing infrastructure

### 24. Testing Strategy
**Assumption**: Manual testing in Phase 19, automated in Phase 22

**Test Scenarios**:
- HIBP integration (known breached password)
- Password history enforcement
- Account lockout (5 failed attempts)
- Unlock after timeout
- Password strength calculation
- Breach cache expiration

**Deferred**: Comprehensive automated testing to Phase 22

**Rationale**: Consistent with Phase 13-18 approach

### 25. Performance Optimization
**Assumption**: Accept slower password operations for security

**Performance Impact**:
- HIBP API: ~100-500ms (async)
- Password history check: ~200ms (10 bcrypt compares)
- Strength calculation: ~50ms (zxcvbn)
- Total: ~350-750ms for password change

**Acceptable**: Password changes are infrequent operations
**Optimization**: Cache, parallel processing (Phase 20)

**Rationale**: Security > speed for password operations

### 26. Mobile Optimization
**Assumption**: Follow Phase 8-10 mobile patterns

**Requirements**:
- 16px input font size (no iOS zoom)
- 44x44px touch targets
- Strength meter visible on mobile
- Responsive password form layout
- Touch-friendly checkbox lists

**Rationale**: Consistent mobile UX

### 27. Accessibility Requirements
**Assumption**: WCAG 2.1 AA compliance

**Features**:
- Screen reader support for strength meter
- ARIA labels on password inputs
- Color + text for strength (not color only)
- Keyboard navigation
- Focus management
- Error message associations

**Rationale**: Accessible security for all users

### 28. Logging and Monitoring
**Assumption**: Comprehensive security event logging

**Logged Events**:
- Password changed (success/failure)
- Breach detected
- Account locked
- Account unlocked
- Failed login attempt
- HIBP API calls
- Strength check results

**Log Fields**: customerId, email, timestamp, ipAddress, reason

**Rationale**: Security audit trail, compliance

### 29. Data Retention Policies
**Assumption**: Balance security with privacy

**Retention**:
- Password history: Indefinite (last 10)
- Login attempts: 90 days
- Breach checks: 1 year (then delete)
- Session logs: 90 days (Phase 18)

**Cleanup**: Nightly cron job

**Rationale**: GDPR compliance, storage management

### 30. No Two-Factor Authentication (Yet)
**Assumption**: 2FA deferred to future phase (post-v2.0)

**Reason**: Phase 19 focuses on password security
**Future**: Phase 20+ will add 2FA (TOTP, SMS, hardware keys)

**Rationale**: Manageable scope for Phase 19

### 31. TypeScript Types Organization
**Assumption**: Shared types for password security

**New Types File**: `packages/shared-types/src/password-security.ts`

```typescript
export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  strength: 'very_weak' | 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  suggestions: string[];
  estimatedCrackTime: string;
  isBreached: boolean;
  breachCount: number;
}

export interface LoginAttempt {
  id: string;
  success: boolean;
  device: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  suspicious: boolean;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingTime: number | null;
  lockedUntil: Date | null;
  failedAttempts: number;
}
```

**Rationale**: Type safety across backend and frontend

### 32. Environment Variables
**Assumption**: Configurable security settings

**New Variables**:
```bash
# HIBP Integration
HIBP_API_URL=https://api.pwnedpasswords.com
HIBP_TIMEOUT=5000  # ms
HIBP_CACHE_DAYS=30

# Account Lockout
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
LOGIN_LOCKOUT_RESET_HOURS=24

# Password History
PASSWORD_HISTORY_LIMIT=10
PASSWORD_REUSE_PREVENTION_DAYS=365

# Password Expiration (optional)
PASSWORD_EXPIRATION_ENABLED=false
PASSWORD_EXPIRATION_DAYS=90

# Feature Flags
ENABLE_BREACH_CHECK=true
ENABLE_STRENGTH_METER=true
ENABLE_LOGIN_TRACKING=true
```

**Rationale**: Flexible configuration for different environments

### 33. NPM Dependencies
**Assumption**: Minimal new dependencies

**Backend**:
- `zxcvbn@4.4.2` - Password strength calculation
- No HIBP library (use built-in fetch)

**Frontend**:
- `zxcvbn@4.4.2` - Client-side strength meter
- Tree-shaking: ~100KB after optimization

**Rationale**: Minimal dependency footprint

### 34. Security Event Notifications
**Assumption**: Email notifications for critical events

**Notification Types**:
- ✅ Password changed (Phase 16 - already exists)
- ✅ Password breach detected (new)
- ✅ Account locked (new)
- ❌ Suspicious login (Phase 20)
- ❌ New device login (Phase 20)

**Email Service**: Reuse existing `notificationService`

**Rationale**: Proactive user notification

### 35. Compliance Considerations
**Assumption**: NIST SP 800-63B and OWASP compliance

**NIST SP 800-63B**:
- ✅ Breach detection (HIBP)
- ✅ No composition rules (flexible requirements)
- ✅ Password history (prevent reuse)
- ✅ Strength feedback
- ✅ Rate limiting

**OWASP Top 10**:
- ✅ A02: Cryptographic Failures (bcrypt)
- ✅ A07: Identification & Auth (lockout, breach check)
- ✅ A09: Security Logging (comprehensive logs)

**Rationale**: Industry best practices compliance

---

## Assumptions Summary

**Total Assumptions**: 35

**Categories**:
- Infrastructure & APIs: 5 assumptions
- Database Schema: 4 assumptions
- Security Policies: 6 assumptions
- Password Strength & Breach: 5 assumptions
- User Experience: 5 assumptions
- Implementation Details: 5 assumptions
- Compliance & Best Practices: 5 assumptions

**High-Risk Assumptions** (require validation):
1. HIBP API availability (assumption #22) - graceful degradation critical
2. Password history performance (assumption #8) - 200ms acceptable?
3. zxcvbn bundle size (assumption #7) - 100KB impact on frontend
4. Account lockout progression (assumption #6) - user experience balance

**Dependencies**:
- Phase 14 (Password Reset) ✅
- Phase 16 (Email Templates) ✅
- Phase 18 (Session Tracking) ✅
- PostgreSQL database ✅
- Email service ✅

**New Dependencies**:
- `zxcvbn` npm package (~400KB raw, ~100KB tree-shaken)
- HIBP API (free, no auth required)

**Deferred to Future Phases**:
- Two-factor authentication → Post-v2.0
- Passwordless login → Post-v2.0
- Hardware security keys → Post-v2.0
- Advanced threat detection → Phase 20
- Parallel bcrypt checking → Phase 20

**Key Decisions**:
- Use HIBP API with k-anonymity (free tier)
- zxcvbn for strength calculation (industry standard)
- 10 password history retention
- 5 failed attempts → 15-minute lockout
- Graceful degradation if HIBP unavailable
- No 2FA in Phase 19 (future enhancement)

---

## Risk Assessment

**Low Risk**:
- Password history implementation (proven pattern)
- Account lockout mechanism (well-understood)
- Frontend strength meter (library handles complexity)

**Medium Risk**:
- HIBP API availability (mitigated by caching)
- Performance impact on password change (mitigated by async)
- User frustration with lockout (mitigated by clear messaging)

**High Risk**:
- None identified (Phase 19 builds on solid foundation)

**Mitigation Strategies**:
- HIBP: Aggressive caching (30 days), graceful degradation
- Performance: Async operations, background processing
- UX: Clear error messages, easy recovery options
- Security: Comprehensive logging, audit trail

---

## Success Metrics

**Functional**:
- [ ] Breach detection operational (HIBP integration)
- [ ] Password history prevents reuse
- [ ] Account lockout after 5 failed attempts
- [ ] Password strength meter provides feedback
- [ ] Login attempts tracked and displayed

**Security**:
- [ ] No password leakage in logs or responses
- [ ] HIBP k-anonymity preserved
- [ ] Lockout mechanism prevents brute force
- [ ] Comprehensive security audit trail

**Performance**:
- [ ] HIBP API calls < 500ms p95
- [ ] Password change < 1 second total
- [ ] Strength meter responsive (< 500ms)
- [ ] No user-facing latency impact

**UX**:
- [ ] Clear lockout messages with countdown
- [ ] Strength meter provides actionable feedback
- [ ] Recovery options always available
- [ ] Mobile-optimized UI
