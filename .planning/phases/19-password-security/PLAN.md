# Phase 19: Advanced Password Security - Implementation Plan

## Overview
Implement enterprise-grade password security with HIBP breach detection, password history tracking, account lockout, and password strength meters.

**Phase Goals**:
- ✅ HIBP API integration for breach detection
- ✅ Password history tracking (prevent reuse)
- ✅ Account lockout after failed attempts
- ✅ Password strength meter (frontend)
- ✅ Login attempt tracking and audit

**Dependencies**: Phase 13-18 complete ✅

**Estimated Tasks**: 20 tasks

---

## Task 1: Install zxcvbn Library

**Objective**: Add password strength calculation library

**Implementation**: Install zxcvbn for both backend and frontend

```bash
cd apps/api && pnpm add zxcvbn@4.4.2
cd apps/lab404-website && pnpm add zxcvbn@4.4.2
```

**Commit Message**: `feat(19-01): add zxcvbn for password strength calculation`

---

## Task 2-4: Database Migrations

**Objective**: Create 3 new tables for password security

**Task 2**: Create `password_history` table
**Task 3**: Create `login_attempts` table
**Task 4**: Create `breach_checks` table

**Migrations**: Use same script pattern as previous phases

**Commit Messages**:
- `feat(19-02): create password_history table`
- `feat(19-03): create login_attempts table`
- `feat(19-04): create breach_checks table`

---

## Task 5-7: Drizzle Schemas

**Objective**: Add TypeScript schemas for new tables

**Files to Create**:
- `packages/database/src/schema/passwordHistory.ts`
- `packages/database/src/schema/loginAttempts.ts`
- `packages/database/src/schema/breachChecks.ts`

**Commit Messages**:
- `feat(19-05): add password history schema`
- `feat(19-06): add login attempts schema`
- `feat(19-07): add breach checks schema`

---

## Task 8: Create HIBPService

**Objective**: Implement Have I Been Pwned API integration

**File**: `apps/api/src/services/hibp.service.ts`

**Key Methods**:
- `checkPassword(password)`: Check using k-anonymity
- `getCachedResult()`: Check cache first
- `setCachedResult()`: Store result for 30 days

**Commit Message**: `feat(19-08): add HIBP breach detection service`

---

## Task 9: Create PasswordSecurityService

**Objective**: Password strength and history checking

**File**: `apps/api/src/services/password-security.service.ts`

**Key Methods**:
- `calculateStrength(password)`: Use zxcvbn
- `checkPasswordHistory()`: Compare against last 10
- `recordPasswordChange()`: Store in history
- `validatePassword()`: Combined check

**Commit Message**: `feat(19-09): add password security service`

---

## Task 10: Create LoginAttemptService

**Objective**: Track login attempts and manage lockouts

**File**: `apps/api/src/services/login-attempt.service.ts`

**Key Methods**:
- `recordAttempt()`: Log success/failure
- `checkLockoutStatus()`: Is account locked?
- `lockAccount()`: Lock after N failures
- `clearFailedAttempts()`: Reset on success

**Commit Message**: `feat(19-10): add login attempt tracking service`

---

## Task 11: Add Password Check API Endpoint

**Objective**: Pre-validation endpoint for password strength

**Endpoint**: `POST /api/auth/password/check`

**Response**: Strength score, breach status, suggestions

**Commit Message**: `feat(19-11): add password strength check endpoint`

---

## Task 12: Update Login Endpoint

**Objective**: Add attempt tracking and lockout enforcement

**Modifications**:
- Check lockout before password validation
- Record failed attempts
- Lock after 5 failures
- Clear attempts on success

**Commit Message**: `feat(19-12): add login attempt tracking and lockout`

---

## Task 13: Update Password Change Endpoint

**Objective**: Add history and breach checking

**Modifications**:
- Check password history (prevent reuse)
- Check HIBP for breaches
- Record password in history
- Calculate strength score

**Commit Message**: `feat(19-13): add password history and breach checking`

---

## Task 14: Update Password Reset Endpoint

**Objective**: Add same checks as password change

**Modifications**: Apply history and breach checks to reset flow

**Commit Message**: `feat(19-14): add password security to reset flow`

---

## Task 15: Add Login Attempts History Endpoint

**Objective**: View login history

**Endpoint**: `GET /api/customers/me/security/login-attempts`

**Response**: Last 50 attempts with device/location info

**Commit Message**: `feat(19-15): add login attempts history endpoint`

---

## Task 16: Add Admin Unlock Endpoint

**Objective**: Support can unlock accounts

**Endpoint**: `POST /api/admin/customers/:id/unlock`

**Auth**: Admin only

**Commit Message**: `feat(19-16): add admin account unlock endpoint`

---

## Task 17: Frontend TypeScript Types

**Objective**: Create shared types for password security

**File**: `apps/lab404-website/src/types/password-security.ts`

**Types**: PasswordStrengthResult, LoginAttempt, LockoutStatus

**Commit Message**: `feat(19-17): add password security TypeScript types`

---

## Task 18: Create PasswordStrengthMeter Component

**Objective**: Real-time password strength visualization

**File**: `apps/lab404-website/src/components/auth/PasswordStrengthMeter.tsx`

**Features**:
- Color-coded strength bar
- Score display (0-4)
- Requirements checklist
- Suggestions
- Breach warning

**Commit Message**: `feat(19-18): add password strength meter component`

---

## Task 19: Update Password Forms

**Objective**: Integrate strength meter into forms

**Files to Modify**:
- Registration form
- Password change form
- Password reset form

**Add**: PasswordStrengthMeter component

**Commit Message**: `feat(19-19): integrate password strength meter`

---

## Task 20: Create Test Structure Documentation

**Objective**: Document test scenarios for Phase 22

**Files to Create**:
- Backend service tests (3 files)
- API endpoint tests
- Frontend component tests

**Commit Message**: `test(19-20): add password security test structure`

---

## Success Criteria

- [ ] zxcvbn installed
- [ ] 3 database tables created
- [ ] 3 Drizzle schemas added
- [ ] HIBPService implemented
- [ ] PasswordSecurityService implemented
- [ ] LoginAttemptService implemented
- [ ] Password check endpoint added
- [ ] Login with lockout tracking
- [ ] Password change with history/breach checks
- [ ] Login history endpoint
- [ ] Admin unlock endpoint
- [ ] Frontend types created
- [ ] PasswordStrengthMeter component
- [ ] Forms updated with meter
- [ ] Test structure documented
- [ ] 20 atomic commits
- [ ] No TypeScript errors

---

## Notes

- HIBP uses k-anonymity (privacy-preserving)
- Cache breach checks for 30 days
- Lockout: 5 attempts → 15 minutes
- Password history: Last 10 passwords
- Graceful degradation if HIBP unavailable
- Test implementation deferred to Phase 22
