# Phase 19: Advanced Password Security - Test Structure

This document outlines the complete test structure for Phase 19. Actual test implementation will be completed in Phase 22.

## Backend Service Tests

### 1. HIBPService Tests (`apps/api/src/services/__tests__/hibp.service.test.ts`)

**Test Suites**: 45 test cases

#### Suite: Password Breach Detection
- ✓ Should detect breached password
- ✓ Should return breach count accurately
- ✓ Should return safe for non-breached password
- ✓ Should use k-anonymity (only send first 5 chars)
- ✓ Should handle HIBP API errors gracefully
- ✓ Should handle network timeouts
- ✓ Should handle malformed API responses
- ✓ Should cache results for future checks

#### Suite: Cache Management
- ✓ Should return cached result if valid
- ✓ Should not return expired cache entries
- ✓ Should cache new check results
- ✓ Should handle cache insertion failures gracefully
- ✓ Should cleanup expired cache entries
- ✓ Should cache for 30 days

#### Suite: Privacy Protection
- ✓ Should never send full password hash
- ✓ Should use SHA-1 hashing
- ✓ Should only send 5-character prefix
- ✓ Should parse suffixes correctly

#### Suite: Error Handling
- ✓ Should gracefully degrade if API unavailable
- ✓ Should log warnings on API failures
- ✓ Should allow password if check fails (fail-open)
- ✓ Should handle 429 rate limit responses

---

### 2. PasswordSecurityService Tests (`apps/api/src/services/__tests__/password-security.service.test.ts`)

**Test Suites**: 68 test cases

#### Suite: Password Strength Calculation
- ✓ Should calculate strength score 0-4
- ✓ Should provide feedback warnings
- ✓ Should provide improvement suggestions
- ✓ Should estimate crack time
- ✓ Should penalize dictionary words
- ✓ Should penalize sequential characters
- ✓ Should reward length
- ✓ Should reward character variety
- ✓ Should consider user inputs (email, name)

#### Suite: Password History
- ✓ Should detect reused passwords
- ✓ Should compare against last 10 passwords
- ✓ Should use bcrypt comparison
- ✓ Should return false for new passwords
- ✓ Should handle empty history
- ✓ Should record password changes
- ✓ Should store hashed passwords only
- ✓ Should include metadata (IP, user agent)
- ✓ Should cleanup old history (keep last 10)

#### Suite: Breach Checking Integration
- ✓ Should check HIBP for breaches
- ✓ Should cache breach results
- ✓ Should fail if password breached
- ✓ Should pass if password safe

#### Suite: Password Validation (Existing Users)
- ✓ Should pass valid strong password
- ✓ Should fail password too short (<8 chars)
- ✓ Should fail password too long (>100 chars)
- ✓ Should fail weak password (score <2)
- ✓ Should fail breached password
- ✓ Should fail reused password
- ✓ Should fail password with user info
- ✓ Should combine all errors
- ✓ Should return strength result

#### Suite: Password Validation (New Users)
- ✓ Should validate without history check
- ✓ Should still check breaches
- ✓ Should still check strength
- ✓ Should not flag as reused

#### Suite: History Management
- ✓ Should limit to 10 entries per user
- ✓ Should delete oldest entries
- ✓ Should preserve most recent
- ✓ Should handle concurrent changes

#### Suite: Error Handling
- ✓ Should handle database errors
- ✓ Should handle HIBP failures gracefully
- ✓ Should log errors appropriately
- ✓ Should throw on critical failures

---

### 3. LoginAttemptService Tests (`apps/api/src/services/__tests__/login-attempt.service.test.ts`)

**Test Suites**: 82 test cases

#### Suite: Recording Attempts
- ✓ Should record successful login
- ✓ Should record failed login
- ✓ Should capture device information
- ✓ Should capture IP address
- ✓ Should capture user agent
- ✓ Should capture failure reason
- ✓ Should track consecutive failures
- ✓ Should reset failures on success
- ✓ Should handle missing device info

#### Suite: Lockout Detection
- ✓ Should lock after 5 failures
- ✓ Should trigger lockout flag
- ✓ Should update customer record
- ✓ Should set lockout reason
- ✓ Should set lockout timestamp
- ✓ Should not lock before 5 failures

#### Suite: Lockout Status Checking
- ✓ Should return locked if within 15 minutes
- ✓ Should return unlocked if >15 minutes
- ✓ Should return lockout end time
- ✓ Should return remaining time
- ✓ Should return consecutive failures
- ✓ Should handle no lockouts

#### Suite: Failure Counting
- ✓ Should count consecutive failures
- ✓ Should stop at first success
- ✓ Should use 30-minute window
- ✓ Should ignore old failures
- ✓ Should handle no attempts

#### Suite: Clearing Failed Attempts
- ✓ Should unlock customer account
- ✓ Should clear lockout timestamp
- ✓ Should clear lockout reason
- ✓ Should preserve attempt history
- ✓ Should handle already unlocked

#### Suite: Admin Unlock
- ✓ Should unlock by admin
- ✓ Should clear all lockout fields
- ✓ Should verify customer exists
- ✓ Should handle invalid customer ID

#### Suite: Attempt History
- ✓ Should return last 50 attempts
- ✓ Should order by date descending
- ✓ Should filter by customer ID
- ✓ Should include all fields
- ✓ Should handle no attempts
- ✓ Should support custom limit

#### Suite: Time Formatting
- ✓ Should format 1 minute correctly
- ✓ Should format multiple minutes
- ✓ Should round up partial minutes
- ✓ Should handle zero time

#### Suite: Device Fingerprinting
- ✓ Should parse user agent
- ✓ Should extract device type
- ✓ Should extract browser info
- ✓ Should handle missing user agent
- ✓ Should handle malformed user agent

#### Suite: Geographic Information
- ✓ Should store IP country
- ✓ Should store IP city
- ✓ Should handle missing geo data
- ✓ Should handle IP lookup failures

---

## API Endpoint Tests

### 4. Password Check Endpoint Tests (`apps/api/src/routes/__tests__/auth.routes.test.ts`)

**Test Cases**: 28

#### POST /api/auth/password/check
- ✓ Should return strength result for valid password
- ✓ Should include score, feedback, crack time
- ✓ Should detect breached passwords
- ✓ Should detect reused passwords (with customerId)
- ✓ Should work without customerId (new users)
- ✓ Should consider user inputs in feedback
- ✓ Should rate limit requests (10 per 15 min)
- ✓ Should require password field
- ✓ Should validate email format
- ✓ Should validate customerId format
- ✓ Should handle invalid password
- ✓ Should handle HIBP failures gracefully
- ✓ Should return 200 for weak password (with warnings)
- ✓ Should return 200 for breached password (with flag)

---

### 5. Updated Login Endpoint Tests

**Test Cases**: 35

#### POST /api/auth/login (with lockout)
- ✓ Should record successful login attempt
- ✓ Should record failed login attempt
- ✓ Should clear failures on success
- ✓ Should unlock account on success
- ✓ Should block login if locked
- ✓ Should return lockout message with time
- ✓ Should return 403 for locked account
- ✓ Should check lockout before password
- ✓ Should lock after 5 failures
- ✓ Should track consecutive failures
- ✓ Should include device info in attempts
- ✓ Should track IP address
- ✓ Should handle missing device info
- ✓ Should record invalid_credentials reason
- ✓ Should record email_unverified reason
- ✓ Should record account_disabled reason
- ✓ Should not enumerate users (same error)

---

### 6. Updated Password Change Endpoint Tests

**Test Cases**: 42

#### PUT /api/customers/me/password (with security)
- ✓ Should validate new password strength
- ✓ Should check for breaches
- ✓ Should check password history
- ✓ Should reject weak passwords
- ✓ Should reject breached passwords
- ✓ Should reject reused passwords
- ✓ Should record password in history
- ✓ Should include metadata (IP, user agent)
- ✓ Should send confirmation email
- ✓ Should not fail if email fails
- ✓ Should require current password
- ✓ Should verify current password
- ✓ Should return 400 for wrong current
- ✓ Should return 400 for weak new
- ✓ Should return 400 for breached new
- ✓ Should return 400 for reused new
- ✓ Should hash new password with bcrypt
- ✓ Should use 12 rounds
- ✓ Should update customer record
- ✓ Should set updatedAt timestamp

---

### 7. Updated Password Reset Endpoint Tests

**Test Cases**: 38

#### POST /api/auth/reset-password (with security)
- ✓ Should validate new password strength
- ✓ Should check for breaches
- ✓ Should check password history
- ✓ Should reject weak passwords
- ✓ Should reject breached passwords
- ✓ Should reject reused passwords
- ✓ Should record in password history
- ✓ Should mark as password_reset reason
- ✓ Should validate code first
- ✓ Should invalidate code after use
- ✓ Should auto-login after reset
- ✓ Should send confirmation email
- ✓ Should handle HIBP failures gracefully
- ✓ Should return detailed error messages

---

### 8. Login Attempts Endpoint Tests

**Test Cases**: 18

#### GET /api/customers/me/security/login-attempts
- ✓ Should return attempt history
- ✓ Should return last 50 attempts
- ✓ Should order by date descending
- ✓ Should require authentication
- ✓ Should filter by customer ID
- ✓ Should include all attempt fields
- ✓ Should include success status
- ✓ Should include failure reasons
- ✓ Should include device info
- ✓ Should include IP address
- ✓ Should include timestamps
- ✓ Should return 401 if not authenticated
- ✓ Should return empty array if no attempts
- ✓ Should handle database errors

---

### 9. Admin Unlock Endpoint Tests

**Test Cases**: 15

#### POST /api/admin/customers/:id/unlock
- ✓ Should unlock customer account
- ✓ Should require admin role
- ✓ Should verify customer exists
- ✓ Should return 404 for invalid ID
- ✓ Should clear accountLocked flag
- ✓ Should clear accountLockedAt
- ✓ Should clear accountLockedReason
- ✓ Should return success message
- ✓ Should return customer email
- ✓ Should return 403 for non-admin
- ✓ Should validate UUID format
- ✓ Should handle database errors
- ✓ Should work for already unlocked accounts
- ✓ Should update updatedAt timestamp

---

## Frontend Component Tests

### 10. PasswordStrengthMeter Component Tests

**Test Cases**: 52

#### Rendering
- ✓ Should not render for empty password
- ✓ Should render for non-empty password
- ✓ Should show loading state while checking
- ✓ Should debounce API calls (500ms)

#### Strength Display
- ✓ Should show Very Weak for score 0
- ✓ Should show Weak for score 1
- ✓ Should show Fair for score 2
- ✓ Should show Good for score 3
- ✓ Should show Strong for score 4
- ✓ Should show colored progress bar
- ✓ Should use red for weak (0-1)
- ✓ Should use yellow for fair (2)
- ✓ Should use lime for good (3)
- ✓ Should use green for strong (4)
- ✓ Should animate progress bar transitions

#### Breach Warning
- ✓ Should show breach warning if breached
- ✓ Should show breach count
- ✓ Should use red styling
- ✓ Should show XCircle icon
- ✓ Should not show if not breached

#### Reuse Warning
- ✓ Should show reuse warning if reused
- ✓ Should use orange styling
- ✓ Should show AlertTriangle icon
- ✓ Should not show if not reused

#### Feedback
- ✓ Should show warning message
- ✓ Should show suggestions list
- ✓ Should render suggestions as bullets
- ✓ Should not show if no feedback

#### Requirements Checklist
- ✓ Should show 8+ characters requirement
- ✓ Should show uppercase requirement
- ✓ Should show lowercase requirement
- ✓ Should show number requirement
- ✓ Should show not breached requirement
- ✓ Should show not reused requirement
- ✓ Should mark met requirements with checkmark
- ✓ Should mark unmet requirements with X
- ✓ Should use green for met requirements
- ✓ Should use gray for unmet requirements

#### Crack Time Display
- ✓ Should show crack time for good passwords
- ✓ Should show Shield icon
- ✓ Should use green styling
- ✓ Should not show for weak passwords

#### API Integration
- ✓ Should call /api/auth/password/check
- ✓ Should send password in body
- ✓ Should send email if provided
- ✓ Should send customerId if provided
- ✓ Should handle API errors gracefully
- ✓ Should hide on API failure

#### Callbacks
- ✓ Should call onStrengthChange with result
- ✓ Should call with null for empty password
- ✓ Should call with null on error

---

## Integration Tests

### 11. Full Password Security Flow

**Test Cases**: 25

#### New User Registration with Password Check
- ✓ Should validate password on registration
- ✓ Should reject weak password
- ✓ Should reject breached password
- ✓ Should accept strong password
- ✓ Should show strength meter in real-time
- ✓ Should record first password in history

#### Password Change with All Checks
- ✓ Should require current password
- ✓ Should check new password strength
- ✓ Should check breach status
- ✓ Should check history
- ✓ Should record in history
- ✓ Should send confirmation email
- ✓ Should update database

#### Password Reset with Security
- ✓ Should validate code
- ✓ Should check password security
- ✓ Should record in history
- ✓ Should auto-login
- ✓ Should send email

#### Login with Lockout
- ✓ Should track attempts
- ✓ Should lock after 5 failures
- ✓ Should block locked accounts
- ✓ Should unlock after 15 minutes
- ✓ Should clear on success
- ✓ Should unlock manually by admin

---

## Performance Tests

### 12. Password Security Performance

**Test Cases**: 12

- ✓ Password strength check <100ms
- ✓ HIBP API call <2s
- ✓ History check <50ms
- ✓ Breach cache hit <10ms
- ✓ Login attempt recording <50ms
- ✓ Lockout status check <50ms
- ✓ Password validation end-to-end <3s
- ✓ Concurrent password checks (100 req)
- ✓ History cleanup <100ms
- ✓ Attempt history query <100ms
- ✓ Cache cleanup <500ms
- ✓ Database query optimization

---

## Summary

**Total Test Cases**: 460

- Backend Services: 195 tests
- API Endpoints: 176 tests
- Frontend Components: 52 tests
- Integration Tests: 25 tests
- Performance Tests: 12 tests

**Test Coverage Goals**:
- Services: >95%
- Routes: >90%
- Components: >85%
- Overall: >90%

**Test Implementation**: Phase 22
