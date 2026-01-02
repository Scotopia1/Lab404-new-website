# Lab404Electronics - Feature Implementation Checklist

## Overview

This checklist MUST be completed for EVERY new feature, algorithm, or significant code change. Copy this checklist into your PR/commit description and check off each item.

---

## Pre-Development Checklist

### Planning
- [ ] Feature requirements documented
- [ ] User inputs identified
- [ ] Database changes planned (if any)
- [ ] API endpoints designed
- [ ] Security implications considered

### Design Review
- [ ] Does this feature handle money/prices? → Ensure server-side calculation only
- [ ] Does this feature accept user input? → Plan input validation
- [ ] Does this feature require authentication? → Plan auth middleware
- [ ] Does this feature involve file uploads? → Plan file validation
- [ ] Does this feature expose data? → Plan data filtering/masking

---

## Development Checklist

### Input Validation
- [ ] All inputs validated with Zod schemas
- [ ] String inputs trimmed and length-limited
- [ ] Numeric inputs have min/max constraints
- [ ] Email/phone formats validated
- [ ] UUIDs validated before database queries
- [ ] Array inputs have size limits
- [ ] No prototype pollution vulnerabilities

```typescript
// Example validation schema
const inputSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().max(255),
  price: z.number().positive().max(999999.99),
  quantity: z.number().int().min(1).max(1000),
});
```

### Authentication & Authorization
- [ ] Endpoint requires appropriate auth level (public/user/admin)
- [ ] Auth middleware applied before handler
- [ ] Resource ownership verified (user can only access their data)
- [ ] Admin-only operations protected
- [ ] Session/token validation implemented

```typescript
// Example auth check
export async function handler(req: Request) {
  const user = await requireAuth(req); // Throws if not authenticated
  const resource = await getResource(req.params.id);
  await requireOwnership(user.id, resource); // Throws if not owner
}
```

### Database Security
- [ ] All queries use Drizzle ORM or parameterized queries
- [ ] No string concatenation in queries
- [ ] Sensitive data filtered from responses
- [ ] Proper indexes for query performance
- [ ] Cascading deletes handled correctly

```typescript
// CORRECT - Using Drizzle ORM
const product = await db.select()
  .from(products)
  .where(eq(products.id, productId));

// NEVER - String concatenation
const product = await db.execute(
  `SELECT * FROM products WHERE id = '${productId}'` // SQL INJECTION!
);
```

### Price & Financial Calculations
- [ ] All calculations done server-side
- [ ] Product prices fetched from database at calculation time
- [ ] Discounts validated and calculated server-side
- [ ] Tax rates fetched from settings, not client
- [ ] Totals recalculated, never trusted from client
- [ ] Order amounts stored as snapshots at checkout time
- [ ] Proper decimal precision (2 decimal places)

```typescript
// CRITICAL - Price calculation pattern
async function calculateOrderTotal(items: CartItem[]): Promise<OrderTotals> {
  // 1. Fetch current prices from DB
  const products = await db.select().from(productsTable)
    .where(inArray(productsTable.id, items.map(i => i.productId)));

  // 2. Calculate subtotal from DB prices
  const subtotal = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)!;
    return sum + Number(product.basePrice) * item.quantity;
  }, 0);

  // 3. Get tax rate from settings
  const taxRate = await getSettingValue('taxRate');

  // 4. Calculate tax
  const taxAmount = subtotal * taxRate;

  // 5. Return totals
  return {
    subtotal: round(subtotal, 2),
    taxAmount: round(taxAmount, 2),
    total: round(subtotal + taxAmount, 2),
  };
}
```

### Error Handling
- [ ] Errors don't expose internal implementation details
- [ ] Stack traces not sent to client in production
- [ ] Generic error messages for sensitive failures
- [ ] Specific error codes for client handling
- [ ] All async operations have try/catch

```typescript
// CORRECT - Safe error handling
catch (error) {
  logger.error('Order creation failed', { error, orderId });
  throw new ApiError('ORDER_CREATION_FAILED', 'Unable to create order');
}

// WRONG - Leaking internal details
catch (error) {
  throw new Error(`Database error: ${error.message} at ${error.stack}`);
}
```

### Logging
- [ ] Sensitive data NOT logged (passwords, tokens, full card numbers)
- [ ] User actions logged for audit trail
- [ ] Errors logged with context (not sensitive data)
- [ ] Log levels appropriate (info, warn, error)

```typescript
// CORRECT logging
logger.info('User login', { userId: user.id, email: maskEmail(user.email) });

// WRONG - logging sensitive data
logger.info('User login', { password: user.password, token: authToken });
```

### XSS Prevention
- [ ] HTML content sanitized before storage
- [ ] User-generated content escaped in responses
- [ ] Rich text uses whitelist of allowed tags
- [ ] URLs validated before rendering

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

### Rate Limiting (for public endpoints)
- [ ] Rate limiting applied to endpoint
- [ ] Appropriate limit for endpoint type
- [ ] Rate limit headers included in response
- [ ] Error response for rate-limited requests

```typescript
// Rate limit configuration
const RATE_LIMITS = {
  'POST /api/auth/login': { requests: 5, window: '15m' },
  'POST /api/orders': { requests: 10, window: '1m' },
  'GET /api/products': { requests: 100, window: '1m' },
};
```

---

## API Endpoint Checklist

For each new API endpoint:

### Endpoint: `[METHOD] /api/[path]`

| Check | Status |
|-------|--------|
| Input validation schema defined | [ ] |
| Auth middleware applied (if needed) | [ ] |
| Rate limiting configured | [ ] |
| Response format follows standard | [ ] |
| Error responses standardized | [ ] |
| Endpoint documented in PROJECT_PLAN.md | [ ] |
| Unit tests written | [ ] |
| Security tests written | [ ] |

---

## File Upload Checklist

For features involving file uploads:

- [ ] File type validated (MIME type)
- [ ] File content verified (magic bytes)
- [ ] File size limited (max 5MB for images)
- [ ] Original filename sanitized/replaced
- [ ] Files stored in proper location (ImageKit)
- [ ] Malicious content scanned
- [ ] Access control implemented

```typescript
const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};
```

---

## Database Migration Checklist

For features involving database changes:

- [ ] Migration file created
- [ ] Migration is reversible (has down migration)
- [ ] Indexes added for common queries
- [ ] Foreign keys properly constrained
- [ ] Default values set appropriately
- [ ] NOT NULL constraints where needed
- [ ] Migration tested on dev database
- [ ] Data migration planned (if modifying existing data)

---

## Post-Development Checklist

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios tested

### Security Review
- [ ] Code reviewed for SQL injection
- [ ] Code reviewed for XSS
- [ ] Code reviewed for auth bypass
- [ ] Code reviewed for price manipulation
- [ ] Code reviewed for data exposure
- [ ] `npm audit` shows no high/critical vulnerabilities

### Documentation
- [ ] API documentation updated
- [ ] TASK_TRACKER.md updated
- [ ] Code comments added where complex
- [ ] Types exported if needed by frontend

### Performance
- [ ] Database queries optimized
- [ ] N+1 queries eliminated
- [ ] Proper caching implemented (if applicable)
- [ ] Response payload minimized

---

## Quick Copy Template

```markdown
## Feature Checklist: [Feature Name]

### Security
- [ ] Input validation with Zod
- [ ] Auth middleware applied
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Price calculations server-side only
- [ ] Sensitive data not exposed
- [ ] Rate limiting applied

### Quality
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Error handling implemented
- [ ] Logging added (no sensitive data)
- [ ] Documentation updated

### Review
- [ ] Self code review completed
- [ ] Security considerations documented
- [ ] TASK_TRACKER.md updated
```

---

## Red Flags - Stop and Review

If any of these are true, STOP and review with security checklist:

1. **Accepting price/total from client** - NEVER do this
2. **Using string concatenation in SQL** - ALWAYS use ORM/params
3. **Logging passwords or tokens** - NEVER log sensitive data
4. **Exposing internal IDs in errors** - Use generic messages
5. **Skipping auth check "for now"** - ALWAYS add auth first
6. **Trusting client-side validation only** - ALWAYS validate server-side
7. **Hardcoding secrets** - ALWAYS use environment variables

---

**Last Updated:** 2025-12-28
**Owner:** Development Team
**Required For:** All PRs and commits
