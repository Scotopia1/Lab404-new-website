# Security Checklist - Lab404 Electronics API

## 🔴 Critical Security Requirements

### 1. Price Calculations (MANDATORY)
- [ ] **NEVER** calculate prices on the client side
- [ ] **NEVER** trust price values from client requests
- [ ] **NEVER** store calculated totals in the database (calculate on-the-fly)
- [ ] All prices fetched from database at calculation time
- [ ] Use `PricingService` for all calculations
- [ ] Promo codes validated server-side against database

### 2. Authentication
- [ ] Passwords hashed with bcrypt (cost factor 12+)
- [ ] JWT tokens signed with strong secret (256-bit minimum)
- [ ] Token expiration enforced (7 days default)
- [ ] Password complexity requirements enforced
- [ ] Rate limiting on auth endpoints
- [ ] Generic error messages (don't reveal user existence)

### 3. Authorization
- [ ] All protected routes use `requireAuth` middleware
- [ ] Admin routes use `requireAdmin` middleware
- [ ] Resource ownership verified before access
- [ ] Role-based access control implemented

---

## 🟠 High Priority Security

### 4. Input Validation
- [ ] All inputs validated with Zod schemas
- [ ] Email addresses validated and normalized (lowercase)
- [ ] UUIDs validated before database queries
- [ ] String lengths enforced
- [ ] Numeric ranges validated (no negative quantities)
- [ ] File uploads validated (type, size)

### 5. SQL Injection Prevention
- [ ] Using Drizzle ORM (parameterized queries)
- [ ] No raw SQL queries with user input
- [ ] All filters sanitized

### 6. XSS Prevention
- [ ] Using DOMPurify for HTML content (blogs)
- [ ] Content-Type headers set correctly
- [ ] JSON responses only (no HTML injection)

### 7. Rate Limiting
- [ ] Auth endpoints: 5 requests per minute
- [ ] API endpoints: 100 requests per minute
- [ ] Strict endpoints (contact, checkout): 10 per minute

### 8. CORS Configuration
- [ ] Only allowed origins specified
- [ ] No wildcard origin with credentials
- [ ] Preflight requests handled

---

## 🟡 Medium Priority Security

### 9. Security Headers
- [ ] Helmet.js configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security (HTTPS)
- [ ] X-Powered-By header removed

### 10. Session Security
- [ ] Session IDs are UUIDs (unpredictable)
- [ ] Cart sessions tied to user or session ID
- [ ] Session expiration implemented

### 11. Error Handling
- [ ] Generic error messages to clients
- [ ] Detailed logs server-side only
- [ ] No stack traces in production
- [ ] No sensitive data in error responses

### 12. File Upload Security
- [ ] File type validation (whitelist)
- [ ] File size limits enforced
- [ ] Files stored in external service (ImageKit)
- [ ] Filenames sanitized

---

## 🟢 Low Priority / Best Practices

### 13. Logging & Monitoring
- [ ] Request logging (Morgan)
- [ ] Admin activity logging
- [ ] Error logging
- [ ] No sensitive data in logs

### 14. Data Protection
- [ ] Password hashes never exposed in responses
- [ ] Sensitive fields excluded from queries
- [ ] Customer data minimized in responses

### 15. API Design
- [ ] RESTful conventions followed
- [ ] Proper HTTP status codes
- [ ] Pagination implemented
- [ ] Consistent response format

---

## 🔒 Endpoint Security Matrix

| Endpoint | Auth Required | Admin Only | Rate Limit | Notes |
|----------|--------------|------------|------------|-------|
| POST /auth/register | No | No | Strict | Validate email, password |
| POST /auth/login | No | No | Strict | Generic error messages |
| GET /products | No | No | Default | Public catalog |
| POST /products | Yes | Yes | Default | Admin creates products |
| PUT /products/:id | Yes | Yes | Default | Admin updates products |
| DELETE /products/:id | Yes | Yes | Default | Admin deletes products |
| GET /cart | No | No | Default | Session-based |
| GET /cart/calculate | No | No | Default | **Server-side calc** |
| POST /orders | No | No | Strict | **Server-side totals** |
| GET /orders | Yes | No | Default | User's own orders |
| GET /orders/admin/all | Yes | Yes | Default | Admin sees all |
| GET /customers/me | Yes | No | Default | Own profile only |
| GET /customers | Yes | Yes | Default | Admin lists all |
| POST /promo-codes/validate | No | No | Default | Server validates |
| GET /quotations | Yes | Yes | Default | Admin only |
| GET /analytics/* | Yes | Yes | Default | Admin only |
| POST /contact | No | No | Strict | Spam prevention |
| GET /upload/* | Yes | Yes | Default | Admin only |

---

## 🧪 Testing Commands

```bash
# Run all API tests
pnpm --filter @lab404/api test

# Run security audit
pnpm --filter @lab404/api test:security

# Run all tests including security
pnpm --filter @lab404/api test:all

# Check database connection
pnpm --filter @lab404/api db:check
```

---

## ⚠️ Pre-Deployment Checklist

- [ ] Environment variables set (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] DATABASE_URL is production database
- [ ] CORS_ORIGINS only includes production domains
- [ ] NODE_ENV=production
- [ ] Debug logging disabled
- [ ] Rate limits appropriate for production
- [ ] SSL/HTTPS configured
- [ ] Database backups configured
- [ ] Error monitoring set up (Sentry, etc.)

---

## 📋 Code Review Checklist

When reviewing PRs, verify:

1. **No client-side price calculations**
2. **Input validation on all new endpoints**
3. **Proper auth middleware applied**
4. **No sensitive data in responses**
5. **No hardcoded secrets**
6. **SQL injection prevention (use ORM)**
7. **Rate limiting on sensitive endpoints**
8. **Error handling doesn't leak info**
9. **Tests cover new functionality**
10. **Security implications documented**

---

## 🚨 Incident Response

If a security issue is discovered:

1. **Isolate** - Disable affected functionality
2. **Assess** - Determine scope and impact
3. **Fix** - Patch the vulnerability
4. **Notify** - Inform affected users if data exposed
5. **Review** - Audit for similar issues
6. **Document** - Record incident and resolution

---

*Last Updated: December 2024*
*Version: 1.0.0*
