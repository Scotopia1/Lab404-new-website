# PLAN: Authentication Foundation Security Fixes

**Phase:** 1 - Critical Security Fixes
**Plan:** 1 of 3
**Objective:** Fix immediate critical authentication vulnerabilities (hardcoded credentials, JWT secret, rate limiting)

---

## Execution Context

**Files to modify:**
- `apps/api/src/routes/auth.routes.ts` - Remove hardcoded admin credentials
- `apps/api/src/config/index.ts` - Enforce JWT_SECRET
- `apps/api/src/server.ts` - Add startup validation
- `apps/api/src/middleware/rateLimiter.ts` - Fix weak dev rate limiting
- `.env.example` - Update with security best practices

**Dependencies:**
- No external dependencies
- No breaking changes to API contracts
- Existing tests may need updates

**Risk Level:** HIGH - Touches authentication system, must test thoroughly

---

## Context

**Current State:**
- Admin credentials hardcoded: `admin@lab404electronics.com / Admin123456` in auth.routes.ts:307-309
- JWT_SECRET has fallback: `'your-super-secret-jwt-key'` in config/index.ts:21
- Dev rate limit is 1000 req/15min (vs prod 5 req/15min) in rateLimiter.ts:23
- These are CRITICAL vulnerabilities per CONCERNS.md

**Goal:**
Remove all hardcoded secrets and enforce proper environment configuration before any other work can proceed.

**From Codebase Analysis:**
- JWT auth working with 7-day expiration
- Role-based access: customer, admin
- Rate limiting per endpoint type (auth, API, strict)
- bcryptjs with 12 rounds for passwords

---

## Tasks

### Task 1: Remove Hardcoded Admin Credentials
**What:** Eliminate hardcoded admin check from auth.routes.ts

**Steps:**
1. Read `apps/api/src/routes/auth.routes.ts` around line 307-309
2. Remove the hardcoded credential check: `if (email === 'admin@lab404electronics.com' && password === 'Admin123456')`
3. Admin login will now use database authentication like regular users
4. Verify admin role is properly set in database for admin accounts
5. Update `.env.example` with note about creating admin accounts via database

**Verification:**
- Admin can no longer login with hardcoded credentials
- Admin login goes through database authentication
- Admin role is checked from database customer record

---

### Task 2: Enforce JWT_SECRET at Startup
**What:** Require JWT_SECRET environment variable with no fallback

**Steps:**
1. Read `apps/api/src/config/index.ts` line 21
2. Remove fallback value: change `process.env['JWT_SECRET'] || 'your-super-secret-jwt-key'` to just `process.env['JWT_SECRET']`
3. Read `apps/api/src/server.ts` to find startup logic
4. Add validation in server.ts before starting Express:
   ```typescript
   if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'].length < 32) {
     logger.error('JWT_SECRET must be set and at least 32 characters');
     process.exit(1);
   }
   ```
5. Update `.env.example` with strong JWT_SECRET example and length requirement

**Verification:**
- Server fails to start if JWT_SECRET is not set
- Server fails to start if JWT_SECRET is too short
- Error message is clear and actionable

---

### Task 3: Fix Weak Development Rate Limiting
**What:** Reduce dev rate limit to secure level

**Steps:**
1. Read `apps/api/src/middleware/rateLimiter.ts` line 23
2. Change auth rate limiter: `max: process.env['NODE_ENV'] === 'development' ? 1000 : 5` to `max: process.env['NODE_ENV'] === 'development' ? 20 : 5`
3. Add comment explaining why dev needs slightly higher limit (testing) but not 1000
4. Document the rate limits in `.env.example` or API docs

**Verification:**
- Development auth endpoint allows 20 requests per 15 min (not 1000)
- Production auth endpoint still allows 5 requests per 15 min
- Rate limiting still functional in both environments

---

## Verification Steps

After completing all tasks:

1. **Environment Validation:**
   - Start API without JWT_SECRET → should fail with clear error
   - Start API with short JWT_SECRET (< 32 chars) → should fail
   - Start API with valid JWT_SECRET → should start successfully

2. **Admin Authentication:**
   - Try login with hardcoded credentials → should fail (401)
   - Create admin user in database with proper role
   - Login as admin with database credentials → should succeed
   - Verify JWT token includes admin role

3. **Rate Limiting:**
   - Make 20 auth requests in dev → should succeed
   - Make 21st auth request in dev → should be rate limited (429)
   - Verify production rate limit unchanged (5 requests)

4. **Regression Testing:**
   - Regular customer login still works
   - JWT token generation still works
   - Protected endpoints still require valid tokens
   - Admin endpoints check for admin role

---

## Success Criteria

- [ ] Hardcoded admin credentials completely removed from code
- [ ] JWT_SECRET environment variable required at startup (no fallback)
- [ ] JWT_SECRET length validated (minimum 32 characters)
- [ ] Development rate limit reduced from 1000 to 20 requests per 15 min
- [ ] Server startup fails gracefully with clear errors if misconfigured
- [ ] Admin authentication works via database (not hardcoded)
- [ ] All existing authentication flows continue to work
- [ ] `.env.example` updated with security best practices
- [ ] Changes committed with clear commit message

---

## Output

**Modified Files:**
- `apps/api/src/routes/auth.routes.ts` - Hardcoded credentials removed
- `apps/api/src/config/index.ts` - JWT_SECRET fallback removed
- `apps/api/src/server.ts` - Startup validation added
- `apps/api/src/middleware/rateLimiter.ts` - Dev rate limit fixed
- `.env.example` - Updated with security requirements

**Git Commit:**
```
fix(security): remove hardcoded credentials and enforce JWT_SECRET

Critical security fixes:
- Remove hardcoded admin credentials from auth.routes.ts
- Enforce JWT_SECRET environment variable at startup
- Validate JWT_SECRET minimum length (32 chars)
- Reduce dev auth rate limit from 1000 to 20 requests

BREAKING: Server now requires JWT_SECRET to be set
BREAKING: Hardcoded admin login no longer works
```

---

## Notes

- This plan addresses 3 of 6 security issues in Phase 1
- No frontend changes required in this plan
- Next plan will migrate to cookie-based authentication
- Admin users must exist in database with role='admin'
- Consider adding script to create first admin user

---

*Plan created: 2026-01-08*
*Estimated time: 1-2 hours*
*Risk: HIGH - Test auth thoroughly*
