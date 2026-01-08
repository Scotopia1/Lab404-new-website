# PLAN: Cookie-Based Authentication Migration

**Phase:** 1 - Critical Security Fixes
**Plan:** 2 of 3
**Objective:** Migrate JWT tokens from localStorage to secure httpOnly cookies

---

## Execution Context

**Files to modify:**
- `apps/api/src/middleware/auth.ts` - Update to read/write cookies
- `apps/api/src/routes/auth.routes.ts` - Send tokens via cookies
- `apps/api/src/app.ts` - Configure cookie parser
- `apps/admin/src/lib/api-client.ts` - Remove localStorage, use cookies
- `apps/lab404-website/src/lib/api.ts` - Remove localStorage, use cookies
- Both apps' auth stores - Update auth state management

**Dependencies:**
- `cookie-parser` npm package (likely already installed)
- Depends on Plan 01-01 (authentication foundation fixed)

**Risk Level:** HIGH - Changes authentication across entire stack

---

## Context

**Current State (VULNERABLE):**
- JWT tokens stored in localStorage: `apps/admin/src/lib/api-client.ts:17` and `apps/lab404-website/src/lib/api.ts:15`
- Vulnerable to XSS attacks - malicious scripts can steal tokens
- Token theft = account takeover

**Target State (SECURE):**
- JWT tokens in httpOnly cookies (JavaScript cannot access)
- Cookies sent automatically with requests
- XSS attacks cannot steal tokens
- CSRF protection will be added in next plan

**From Codebase Analysis:**
- Current auth: JWT with 7-day expiration
- API expects `Authorization: Bearer <token>` header
- Frontends store token in localStorage and add to Axios interceptors
- CORS already configured between apps

**Breaking Change:**
This migration maintains backward compatibility temporarily by accepting BOTH cookie and Bearer token auth, then remove Bearer support after frontend deployment.

---

## Tasks

### Task 1: API Cookie Authentication Support
**What:** Update API to send and accept JWT via httpOnly cookies

**Steps:**
1. Install/verify `cookie-parser` in API: Check `apps/api/package.json`, add if missing
2. Read `apps/api/src/app.ts` - add cookie-parser middleware:
   ```typescript
   import cookieParser from 'cookie-parser';
   app.use(cookieParser());
   ```
3. Read `apps/api/src/routes/auth.routes.ts` login/register routes
4. Update login success response to set httpOnly cookie:
   ```typescript
   res.cookie('auth_token', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
   });
   ```
5. Update logout route to clear cookie: `res.clearCookie('auth_token')`
6. Read `apps/api/src/middleware/auth.ts`
7. Update `extractToken` function to check cookie first, fallback to Bearer header (temporary):
   ```typescript
   // Try cookie first
   const cookieToken = req.cookies?.auth_token;
   if (cookieToken) return cookieToken;

   // Fallback to Bearer header (remove after frontend deployed)
   const authHeader = req.headers.authorization;
   // ... existing Bearer logic
   ```
8. Update CORS config in `apps/api/src/app.ts` to allow credentials:
   ```typescript
   cors({
     origin: config.corsOrigins,
     credentials: true, // Important for cookies
   })
   ```

**Verification:**
- Login returns token in httpOnly cookie
- Cookie has correct security flags
- Auth middleware reads token from cookie
- Logout clears cookie
- Bearer header still works (temporary)

---

### Task 2: Admin App Cookie Authentication
**What:** Update admin app to use cookies instead of localStorage

**Steps:**
1. Read `apps/admin/src/lib/api-client.ts`
2. Remove localStorage token storage on login:
   - Remove `localStorage.setItem('token', token)`
   - Remove `localStorage.getItem('token')` from interceptor
3. Update Axios config to send credentials:
   ```typescript
   const apiClient = axios.create({
     baseURL: API_URL,
     withCredentials: true, // Send cookies with requests
   });
   ```
4. Update request interceptor - remove manual Authorization header (cookies sent automatically)
5. Read admin auth store (Zustand) - may need to update state management
6. Update logout to call API (which clears cookie) instead of just clearing localStorage
7. Test login/logout flow in admin app
8. Check that protected routes still work

**Verification:**
- Admin login succeeds without localStorage
- Cookies sent automatically with API requests
- Protected admin routes work
- Logout clears auth_token cookie
- No token visible in localStorage or sessionStorage

---

### Task 3: Website App Cookie Authentication
**What:** Update website app to use cookies instead of localStorage

**Steps:**
1. Read `apps/lab404-website/src/lib/api.ts`
2. Apply same changes as admin app:
   - Remove localStorage token operations
   - Add `withCredentials: true` to Axios config
   - Remove Authorization header from interceptor
3. Read website auth store - update as needed
4. Update any customer account pages that check auth state
5. Test login/logout/register flows on website
6. Test customer account pages (orders, addresses, profile)
7. Verify cart persistence works for authenticated users

**Verification:**
- Customer login/register work without localStorage
- Customer account pages accessible when authenticated
- Cart properly associated with authenticated user
- Logout works and clears cookie
- Public pages still accessible

---

## Verification Steps

After completing all tasks:

1. **API Testing:**
   - Login via API → receives httpOnly cookie
   - Make authenticated request with cookie → succeeds
   - Make authenticated request with Bearer token → still works (temporary)
   - Logout → cookie cleared
   - Cookie has correct flags: httpOnly, secure (prod), sameSite=strict

2. **Admin App Testing:**
   - Login → no token in localStorage
   - Navigate to protected pages → works
   - Refresh page → still authenticated
   - Logout → cookie cleared, redirected to login
   - Check DevTools → auth_token cookie visible, httpOnly=true

3. **Website Testing:**
   - Customer registration → authenticated with cookie
   - Customer login → authenticated with cookie
   - Browse products → cart works
   - View account pages → order history, addresses work
   - Logout → cookie cleared
   - Public pages accessible without auth

4. **Cross-App Testing:**
   - Login to admin → only admin cookie set
   - Login to website in same browser → separate website cookie
   - Cookies scoped correctly (not shared)

5. **Security Testing:**
   - Try to read auth_token via JavaScript console → should be undefined (httpOnly)
   - Verify cookies only sent to same origin
   - Check XSS attempts cannot steal tokens

---

## Success Criteria

- [ ] API sends JWT tokens via httpOnly cookies on login/register
- [ ] API reads tokens from cookies (with Bearer fallback for migration)
- [ ] API clears cookies on logout
- [ ] CORS configured with credentials: true
- [ ] Admin app uses cookies, no localStorage token storage
- [ ] Admin app sends withCredentials: true on all API requests
- [ ] Website app uses cookies, no localStorage token storage
- [ ] Website app sends withCredentials: true on all API requests
- [ ] All authentication flows work (login, register, logout, refresh)
- [ ] Protected routes/pages still secured properly
- [ ] Cookies have security flags: httpOnly, secure (prod), sameSite=strict
- [ ] No tokens visible in localStorage or sessionStorage
- [ ] Changes committed with clear migration notes

---

## Output

**Modified Files:**
- `apps/api/package.json` - Added cookie-parser (if needed)
- `apps/api/src/app.ts` - Cookie parser middleware, CORS credentials
- `apps/api/src/middleware/auth.ts` - Cookie token extraction
- `apps/api/src/routes/auth.routes.ts` - Set/clear cookies
- `apps/admin/src/lib/api-client.ts` - withCredentials, no localStorage
- `apps/admin/src/store/*` - Updated auth state (if needed)
- `apps/lab404-website/src/lib/api.ts` - withCredentials, no localStorage
- `apps/lab404-website/src/store/auth-store.ts` - Updated auth state (if needed)

**Git Commit:**
```
fix(security): migrate JWT tokens to httpOnly cookies

Security improvement to prevent XSS token theft:
- API sends tokens via httpOnly cookies on login/register
- API clears cookies on logout
- Both frontend apps use cookies instead of localStorage
- CORS configured to allow credentials
- Backward compatible: Bearer token still works temporarily

BREAKING: Frontend apps require redeployment with API
SECURITY: Tokens now protected from XSS attacks

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Notes

- This is the most complex task in Phase 1
- Requires coordinated deployment: API first, then frontends
- Temporary backward compatibility (Bearer tokens) eases deployment
- Remove Bearer token support in follow-up after confirmed working
- Consider session management improvement in future (server-side invalidation)
- This protects against XSS but not CSRF (Plan 03 adds CSRF protection)

---

## Rollback Plan

If issues found in production:
1. Revert frontend deployments (admin + website)
2. Old frontend will use Bearer tokens (still supported)
3. Fix issues, redeploy
4. API cookie support is backward compatible, no API rollback needed

---

*Plan created: 2026-01-08*
*Estimated time: 3-4 hours*
*Risk: HIGH - Test thoroughly, coordinate deployment*
