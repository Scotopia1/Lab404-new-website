# PLAN: CSRF & XSS Protection Implementation

**Phase:** 1 - Critical Security Fixes
**Plan:** 3 of 3
**Objective:** Add CSRF protection middleware, XSS input sanitization, and secure cron endpoints

---

## Execution Context

**Files to modify:**
- `apps/api/src/middleware/csrf.ts` - New CSRF middleware
- `apps/api/src/middleware/xss.ts` - New XSS sanitization middleware
- `apps/api/src/app.ts` - Apply middleware
- `apps/api/src/routes/cron.routes.ts` - Secure cron endpoints
- `apps/admin/src/lib/api-client.ts` - CSRF token handling
- `apps/lab404-website/src/lib/api.ts` - CSRF token handling

**Dependencies:**
- `csurf` or `csrf` npm package for CSRF protection
- `xss-clean` or `dompurify` for sanitization
- Depends on Plan 01-02 (cookie-based auth working)

**Risk Level:** MEDIUM - New security layer, should not break existing functionality

---

## Context

**Current State (VULNERABLE):**
- No CSRF protection: State-changing operations vulnerable to cross-site requests
- No XSS sanitization: User input not sanitized (blog posts, customer notes)
- Cron endpoints: Weak secret validation, no rate limiting, dev bypass

**Target State (SECURE):**
- CSRF tokens required for POST/PUT/DELETE/PATCH operations
- All user input sanitized before storage
- Cron endpoints properly secured with rate limiting

**From Codebase Analysis:**
- CORS configured but not enforcing CSRF
- Blog posts accept HTML content (admin)
- Customer notes stored without sanitization
- Cron secret: plain string comparison, 1000 req/min dev bypass

**Security Approach:**
- Double-submit cookie pattern for CSRF (stateless, scalable)
- Sanitize on input (before database)
- Whitelist safe HTML tags if needed (blog posts)

---

## Tasks

### Task 1: Implement CSRF Protection
**What:** Add CSRF middleware to protect state-changing operations

**Steps:**
1. Install CSRF package: `pnpm add --filter @lab404/api csrf`
2. Create `apps/api/src/middleware/csrf.ts`:
   ```typescript
   import { doubleCsrf } from 'csrf-csrf';

   const {
     generateToken,
     doubleCsrfProtection,
   } = doubleCsrf({
     getSecret: () => process.env.CSRF_SECRET || process.env.JWT_SECRET,
     cookieName: 'x-csrf-token',
     cookieOptions: {
       httpOnly: true,
       sameSite: 'strict',
       secure: process.env.NODE_ENV === 'production',
     },
     getTokenFromRequest: (req) => req.headers['x-csrf-token'],
   });

   export { generateToken as generateCsrfToken, doubleCsrfProtection };
   ```
3. Read `apps/api/src/app.ts`
4. Apply CSRF protection to state-changing routes (skip GET, HEAD, OPTIONS):
   ```typescript
   import { doubleCsrfProtection } from './middleware/csrf';

   // Apply after cookie-parser, before routes
   app.use((req, res, next) => {
     // Skip CSRF for safe methods and health checks
     if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/api/health') {
       return next();
     }
     doubleCsrfProtection(req, res, next);
   });
   ```
5. Add endpoint to get CSRF token: `GET /api/csrf-token`
   ```typescript
   app.get('/api/csrf-token', (req, res) => {
     const token = generateCsrfToken(req, res);
     res.json({ csrfToken: token });
   });
   ```
6. Read `apps/admin/src/lib/api-client.ts`
7. Add CSRF token fetching and header injection:
   ```typescript
   // Fetch CSRF token on app init
   const fetchCsrfToken = async () => {
     const { data } = await axios.get('/api/csrf-token');
     return data.csrfToken;
   };

   // Add to request interceptor
   apiClient.interceptors.request.use(async (config) => {
     if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
       const token = await fetchCsrfToken();
       config.headers['x-csrf-token'] = token;
     }
     return config;
   });
   ```
8. Repeat CSRF token handling for `apps/lab404-website/src/lib/api.ts`
9. Update `.env.example` with optional CSRF_SECRET (uses JWT_SECRET if not set)

**Verification:**
- GET requests work without CSRF token
- POST/PUT/DELETE without CSRF token → 403 Forbidden
- POST/PUT/DELETE with valid CSRF token → succeed
- CSRF token refreshes properly
- Frontend requests include CSRF header

---

### Task 2: Add XSS Input Sanitization
**What:** Sanitize all user input to prevent XSS attacks

**Steps:**
1. Install sanitization package: `pnpm add --filter @lab404/api xss-clean dompurify isomorphic-dompurify`
2. Create `apps/api/src/middleware/xss.ts`:
   ```typescript
   import createDOMPurify from 'isomorphic-dompurify';
   import { Request, Response, NextFunction } from 'express';

   const DOMPurify = createDOMPurify();

   // Sanitize function
   const sanitize = (obj: any): any => {
     if (typeof obj === 'string') {
       return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] }); // Strip all HTML by default
     }
     if (Array.isArray(obj)) {
       return obj.map(sanitize);
     }
     if (obj && typeof obj === 'object') {
       const sanitized: any = {};
       for (const key in obj) {
         sanitized[key] = sanitize(obj[key]);
       }
       return sanitized;
     }
     return obj;
   };

   // Middleware
   export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
     if (req.body) req.body = sanitize(req.body);
     if (req.query) req.query = sanitize(req.query);
     if (req.params) req.params = sanitize(req.params);
     next();
   };

   // For rich content (blogs) - allow safe HTML
   export const sanitizeRichContent = (html: string): string => {
     return DOMPurify.sanitize(html, {
       ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'img'],
       ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
     });
   };
   ```
3. Read `apps/api/src/app.ts`
4. Apply XSS middleware globally (after body-parser, before routes):
   ```typescript
   import { xssSanitize } from './middleware/xss';
   app.use(xssSanitize);
   ```
5. Read `apps/api/src/routes/blogs.routes.ts`
6. For blog content, use `sanitizeRichContent` instead of stripping all HTML:
   ```typescript
   import { sanitizeRichContent } from '../middleware/xss';

   // On blog create/update
   const sanitizedContent = sanitizeRichContent(req.body.content);
   ```
7. Identify other fields that accept HTML (check CONCERNS.md):
   - Customer notes
   - Product descriptions
   - Category descriptions
8. Apply appropriate sanitization to each

**Verification:**
- Plain text inputs sanitized (strips HTML)
- Blog content allows safe HTML only
- Script tags removed from all inputs
- Event handlers (onclick, onerror) stripped
- Dangerous HTML elements blocked
- Safe formatting preserved in rich content

---

### Task 3: Secure Cron Endpoints
**What:** Add proper security to cron job endpoints

**Steps:**
1. Read `apps/api/src/routes/cron.routes.ts` lines 12-24
2. Remove development bypass that allows no secret:
   ```typescript
   // REMOVE THIS:
   if (process.env.NODE_ENV === 'development' && !expectedSecret) {
     return next();
   }
   ```
3. Require CRON_SECRET in all environments:
   ```typescript
   const expectedSecret = process.env.CRON_SECRET;

   if (!expectedSecret) {
     logger.error('CRON_SECRET not configured');
     return res.status(503).json({ error: 'Cron jobs not configured' });
   }

   if (providedSecret !== expectedSecret) {
     logger.warn('Invalid cron secret attempt', { ip: req.ip });
     return res.status(403).json({ error: 'Forbidden' });
   }
   ```
4. Read `apps/api/src/middleware/rateLimiter.ts`
5. Create cron-specific rate limiter:
   ```typescript
   export const cronLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 10, // Max 10 cron requests per 15 min
     message: 'Too many cron requests',
     standardHeaders: true,
     legacyHeaders: false,
   });
   ```
6. Apply cron rate limiter to cron routes:
   ```typescript
   import { cronLimiter } from '../middleware/rateLimiter';

   cronRoutes.use(cronLimiter);
   ```
7. Add CRON_SECRET validation to `apps/api/src/server.ts` startup:
   ```typescript
   if (!process.env.CRON_SECRET) {
     logger.warn('CRON_SECRET not set - cron endpoints disabled');
   } else if (process.env.CRON_SECRET.length < 32) {
     logger.warn('CRON_SECRET should be at least 32 characters');
   }
   ```
8. Update `.env.example` with CRON_SECRET example and requirements

**Verification:**
- Cron request without secret → 403 Forbidden
- Cron request with wrong secret → 403 Forbidden
- Cron request with valid secret → succeeds
- 11th cron request in 15 min → 429 Too Many Requests
- Development doesn't bypass cron security
- Server logs warning if CRON_SECRET not configured

---

## Verification Steps

After completing all tasks:

1. **CSRF Protection:**
   - Make POST request without CSRF token → 403
   - Fetch CSRF token from `/api/csrf-token` → succeeds
   - Make POST request with token → succeeds
   - Admin app state-changing requests → include CSRF token
   - Website state-changing requests → include CSRF token

2. **XSS Sanitization:**
   - Submit form with `<script>alert('xss')</script>` → script stripped
   - Create blog post with safe HTML → formatting preserved
   - Create blog post with `<script>` → script removed, safe HTML kept
   - Customer notes with HTML → sanitized
   - Check database: no malicious scripts stored

3. **Cron Security:**
   - Cron request without secret → 403
   - Cron request with valid secret → succeeds
   - 11 cron requests in 15 min → rate limited
   - Development environment still requires secret
   - Server starts with warning if CRON_SECRET missing

4. **Regression Testing:**
   - All existing API endpoints still work
   - Admin dashboard functions normally
   - Website functions normally
   - No performance degradation from middleware

---

## Success Criteria

- [ ] CSRF protection middleware implemented and active
- [ ] CSRF tokens required for POST/PUT/DELETE/PATCH operations
- [ ] GET requests work without CSRF tokens
- [ ] Admin app fetches and sends CSRF tokens
- [ ] Website app fetches and sends CSRF tokens
- [ ] XSS sanitization middleware applied globally
- [ ] All user input sanitized before database storage
- [ ] Blog posts allow safe HTML only (whitelist approach)
- [ ] Script tags and event handlers blocked everywhere
- [ ] Cron endpoints require CRON_SECRET (no dev bypass)
- [ ] Cron endpoints have rate limiting (10 req/15min)
- [ ] Server validates secrets at startup
- [ ] `.env.example` updated with CSRF_SECRET and CRON_SECRET
- [ ] All Phase 1 security issues resolved
- [ ] Changes committed with security notes

---

## Output

**New Files:**
- `apps/api/src/middleware/csrf.ts` - CSRF protection
- `apps/api/src/middleware/xss.ts` - XSS sanitization

**Modified Files:**
- `apps/api/package.json` - Added csrf, xss-clean, dompurify packages
- `apps/api/src/app.ts` - Applied CSRF and XSS middleware
- `apps/api/src/routes/cron.routes.ts` - Secured cron endpoints
- `apps/api/src/middleware/rateLimiter.ts` - Added cron rate limiter
- `apps/api/src/routes/blogs.routes.ts` - Rich content sanitization
- `apps/api/src/server.ts` - Secret validation at startup
- `apps/admin/src/lib/api-client.ts` - CSRF token handling
- `apps/lab404-website/src/lib/api.ts` - CSRF token handling
- `.env.example` - Added CSRF_SECRET, CRON_SECRET

**Git Commit:**
```
fix(security): add CSRF protection, XSS sanitization, secure cron endpoints

Security enhancements:
- CSRF protection for all state-changing operations
- XSS input sanitization with safe HTML whitelist for rich content
- Cron endpoints secured with proper secret validation and rate limiting
- All Phase 1 critical security issues resolved

BREAKING: API requires CSRF tokens for POST/PUT/DELETE/PATCH
BREAKING: Cron endpoints require CRON_SECRET (no dev bypass)
SECURITY: XSS attacks blocked via input sanitization

Phase 1 complete: Production security foundation established

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Notes

- This completes Phase 1: Critical Security Fixes
- All 6 security issues from CONCERNS.md addressed:
  ✅ Hardcoded admin credentials (Plan 1)
  ✅ JWT secret fallback (Plan 1)
  ✅ Token storage in localStorage (Plan 2)
  ✅ Missing CSRF protection (Plan 3)
  ✅ Weak rate limiting in dev (Plan 1)
  ✅ Cron secret vulnerability (Plan 3)
  ✅ XSS vulnerabilities (Plan 3)

- Production-ready security foundation established
- Ready to proceed with Phase 2: Backend Tax & Pricing Infrastructure

---

## Post-Completion Checklist

Before marking Phase 1 complete:
- [ ] All 3 plans executed successfully
- [ ] All tests passing (if any exist)
- [ ] Manual testing completed for each security fix
- [ ] Security audit confirms vulnerabilities resolved
- [ ] Documentation updated (API docs, README, .env.example)
- [ ] Changes deployed to staging and tested
- [ ] Team briefed on new security requirements (CSRF tokens, secrets)

---

*Plan created: 2026-01-08*
*Estimated time: 2-3 hours*
*Risk: MEDIUM - New security layer, test thoroughly*
*Phase 1 Total Time: 6-9 hours across 3 plans*
