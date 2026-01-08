# Technical Concerns & Debt

## 🚨 CRITICAL SECURITY ISSUES

### 1. Hardcoded Admin Credentials

**Location:** `apps/api/src/routes/auth.routes.ts:307-309`

```typescript
if (email === 'admin@lab404electronics.com' && password === 'Admin123456') {
```

**Risk:** CRITICAL
- Admin credentials exposed in source code
- Anyone with code access can impersonate admin
- Visible in version control history

**Impact:** Complete admin account compromise

**Action:** IMMEDIATE
- Remove hardcoded credentials
- Use environment variables
- Implement proper admin authentication

---

### 2. JWT Secret Fallback

**Location:** `apps/api/src/config/index.ts:21`

```typescript
jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key'
```

**Risk:** CRITICAL
- Default secret in code allows token forgery
- No enforcement that env var must be set
- Production deployment could use default

**Impact:** Session hijacking, token impersonation

**Action:** IMMEDIATE
- Require JWT_SECRET at startup
- Fail if not configured
- No fallback value

---

### 3. Token Storage in localStorage

**Locations:**
- `apps/admin/src/lib/api-client.ts:17`
- `apps/lab404-website/src/lib/api.ts:15`

**Risk:** HIGH
- JWT tokens stored in localStorage
- Vulnerable to XSS attacks
- Token can be stolen via malicious scripts

**Impact:** Account takeover via XSS

**Action:** HIGH PRIORITY
- Move to httpOnly cookies
- Update API to use cookies
- Update clients to remove localStorage

---

### 4. Missing CSRF Protection

**Location:** `apps/api/src/app.ts:36`

**Risk:** HIGH
- CSRF header defined but not validated
- No CSRF middleware implemented
- State-changing operations vulnerable

**Impact:** Unauthorized actions from other domains

**Action:** HIGH PRIORITY
- Implement CSRF token validation
- Add CSRF middleware
- Validate on POST/PUT/DELETE

---

### 5. Weak Rate Limiting in Development

**Location:** `apps/api/src/middleware/rateLimiter.ts:23`

```typescript
max: process.env['NODE_ENV'] === 'development' ? 1000 : 5
```

**Risk:** MEDIUM
- Development allows 1000 auth attempts per 15 min
- Makes brute force trivial in dev
- Dev code may reach production

**Impact:** Credential enumeration in dev environments

**Action:** MEDIUM PRIORITY
- Reduce dev rate limit
- Use separate dev secrets
- Audit dev vs prod differences

---

### 6. Cron Secret Vulnerability

**Location:** `apps/api/src/routes/cron.routes.ts:12-24`

**Risk:** MEDIUM
- Plain string comparison
- No rate limiting on cron endpoints
- Development bypass allows no secret

**Impact:** Unauthorized cron job execution

**Action:** MEDIUM PRIORITY
- Add rate limiting to cron endpoints
- Use more secure secret validation
- Remove dev bypass in production

---

## ⚠️ HIGH PRIORITY ISSUES

### 1. Unimplemented TODO Features

**Contact Form:**
- `apps/api/src/routes/contact.routes.ts:44-46`
- Email service not integrated
- Database storage missing
- reCAPTCHA validation missing
- Currently only logs to console

**Newsletter:**
- `apps/api/src/routes/contact.routes.ts:83-84`
- Email marketing integration missing
- No database storage

**Quote Request:**
- `apps/api/src/routes/contact.routes.ts:130-132`
- Quotation creation not implemented
- Email notifications missing

**Quotation to Order:**
- `apps/api/src/routes/quotations.routes.ts:1447`
- Order creation from quote not working

**Import Jobs:**
- `apps/api/src/routes/import.routes.ts:379, 469`
- Background processing not implemented
- Job re-queuing missing

**Impact:** Core features non-functional

**Action:** HIGH PRIORITY
- Implement missing features
- Remove TODO comments
- Test implementations

---

### 2. Very Large Route Files

**Sizes:**
- `quotations.routes.ts` - 1,875 lines ⚠️
- `orders.routes.ts` - 1,002 lines
- `customers.routes.ts` - 963 lines

**Issues:**
- Hard to maintain and test
- Slower route matching
- Complex logic mixing

**Impact:** Maintainability, performance

**Action:** HIGH PRIORITY
- Split into sub-routers
- Extract business logic to services
- Separate admin/public routes

---

### 3. Synchronous CSV Processing

**Location:** `apps/api/src/routes/import.routes.ts:63-150`

**Issues:**
- Large CSV imports block request
- No background processing
- Could timeout on large files
- Poor UX during import

**Impact:** Server hanging, timeouts

**Action:** HIGH PRIORITY
- Implement job queue
- Process imports in background
- Add progress tracking

---

### 4. Missing Audit Logging

**Current State:** No audit trail visible

**Issues:**
- Can't track who made changes
- No change history
- Compliance issues (GDPR, PCI)

**Impact:** Security, compliance, debugging

**Action:** HIGH PRIORITY
- Implement audit logging
- Track user actions
- Store change history

---

## 🟡 MEDIUM PRIORITY ISSUES

### 1. N+1 Query Patterns

**Location:** `apps/api/src/services/pricing.service.ts:90-117`

**Issues:**
- Fetches products individually in loop
- No query batching
- Multiple database round-trips

**Impact:** Performance degradation with many items

**Action:** MEDIUM PRIORITY
- Implement query batching
- Add query optimization
- Consider caching

---

### 2. Missing Input Sanitization for XSS

**Locations:**
- Blog posts: `apps/admin/src/app/.../blogs/[id]/edit/page.tsx`
- User content not escaped
- Rich text editor content

**Issues:**
- HTML content from admin not sanitized
- Potential XSS vectors
- User input in notifications

**Impact:** XSS attacks, script injection

**Action:** MEDIUM PRIORITY
- Sanitize all user input
- Escape HTML output
- Use DOMPurify consistently

---

### 3. No Session Management

**Current State:** JWT only

**Issues:**
- Can't invalidate sessions server-side
- Logout just removes client token
- No concurrent session limits
- Can't force logout

**Impact:** Security, user management

**Action:** MEDIUM PRIORITY
- Add session storage
- Implement server-side invalidation
- Add session management UI

---

### 4. Inconsistent Error Handling

**Pattern:** All errors use `next(error)`

**Issues:**
- No distinction between error types
- Context lost in global handler
- No error tracking/monitoring
- All logged at same level

**Impact:** Debugging difficulty

**Action:** MEDIUM PRIORITY
- Add structured error handling
- Implement error tracking (Sentry)
- Add context preservation

---

### 5. Missing Data Encryption

**Current State:** Sensitive data stored plaintext

**Data at Risk:**
- Customer addresses (JSONB)
- Phone numbers
- Customer notes

**Impact:** Data breach exposure

**Action:** MEDIUM PRIORITY
- Implement field-level encryption
- Encrypt sensitive columns
- Add encryption keys to config

---

## 🔵 CODE QUALITY ISSUES

### 1. Magic Numbers and Strings

**Examples:**
```typescript
bcrypt.hash(password, 12)  // 12 rounds
'10mb'  // Request size limit
100  // Default rate limit
```

**Impact:** Maintainability

**Action:** LOW PRIORITY
- Define constants
- Extract to config
- Document values

---

### 2. Weak Password Validation

**Location:** `apps/api/src/routes/auth.routes.ts:18-23`

**Issues:**
- Limited weak password list (26 items)
- Common patterns would pass
- No sequential character check
- No pattern detection

**Impact:** Weak passwords allowed

**Action:** LOW PRIORITY
- Expand weak password list
- Add pattern detection
- Consider zxcvbn library

---

### 3. Logging to Console Only

**Location:** `apps/api/src/utils/logger.ts`

**Issues:**
- Console output only
- No structured logging
- No log aggregation
- Same output in prod/dev

**Impact:** Production debugging

**Action:** LOW PRIORITY
- Use structured logger (Winston, Pino)
- Add log aggregation
- Environment-specific logging

---

### 4. Commented-Out Code

**Example:** `apps/api/src/routes/contact.routes.ts:44-46`

**Issues:**
- TODO comments instead of implementation
- Commented code sections
- Unclear intent

**Impact:** Code cleanliness

**Action:** LOW PRIORITY
- Implement or remove TODOs
- Remove commented code
- Clean up dead code

---

## 📚 DOCUMENTATION GAPS

### 1. Missing API Documentation

**Current State:**
- No Swagger/OpenAPI specs
- `/api/docs` not implemented
- Complex schemas undocumented

**Impact:** Developer experience

**Action:** MEDIUM PRIORITY
- Add Swagger/OpenAPI
- Document all endpoints
- Generate from code

---

### 2. Missing Database Documentation

**Current State:**
- No ER diagram
- Complex relationships undocumented
- Migration history unclear

**Impact:** Developer onboarding

**Action:** LOW PRIORITY
- Create ER diagram
- Document relationships
- Add schema documentation

---

### 3. Missing Security Policy

**Current State:**
- No SECURITY.md
- No vulnerability reporting process
- Rate limiting policy undocumented

**Impact:** Security communication

**Action:** LOW PRIORITY
- Add SECURITY.md
- Document security policies
- Add reporting process

---

## 🔄 DEPENDENCY CONCERNS

### 1. Zod Version Inconsistency

**Versions:**
- Admin: `3.25.76`
- Website: `3.24.1`
- API: `3.23.0`

**Impact:** Validation inconsistencies

**Action:** LOW PRIORITY
- Standardize Zod version
- Test compatibility
- Update all apps

---

### 2. React 19 Compatibility

**Current Version:** `19.2.3`

**Concerns:**
- React 19 is very new
- Potential library compatibility issues
- Radix UI, TanStack compatibility

**Impact:** Potential runtime issues

**Action:** LOW PRIORITY
- Monitor for issues
- Check library compatibility
- Consider downgrade if issues

---

## 📊 PRIORITY SUMMARY

**IMMEDIATE (Before Production):**
1. ✅ Remove hardcoded admin credentials
2. ✅ Enforce JWT_SECRET requirement
3. ✅ Move tokens to httpOnly cookies
4. ✅ Implement CSRF protection
5. ✅ Add rate limiting to cron endpoints

**HIGH (Next Sprint):**
1. ⚠️ Implement TODO features
2. ⚠️ Add audit logging
3. ⚠️ Implement background job queue
4. ⚠️ Split large route files
5. ⚠️ Add XSS sanitization

**MEDIUM (Before Scale):**
1. 🟡 Optimize database queries
2. 🟡 Add session management
3. 🟡 Implement data encryption
4. 🟡 Add API documentation
5. 🟡 Implement error tracking

**LOW (Quality of Life):**
1. 🔵 Define constants for magic numbers
2. 🔵 Improve logging system
3. 🔵 Clean up commented code
4. 🔵 Standardize dependencies
5. 🔵 Add database documentation

---

## Risk Assessment

**Current Risk Level:** ⚠️ **Pre-Production**

The codebase is functional but contains several critical security vulnerabilities that **must be addressed before handling real customer data**. The architecture is sound but needs security hardening, audit logging, and better error handling before production use.

**Production Readiness:** 60%
- ✅ Core functionality works
- ✅ Modern tech stack
- ❌ Critical security issues
- ❌ Missing audit logging
- ❌ No session management
- ❌ Incomplete features
