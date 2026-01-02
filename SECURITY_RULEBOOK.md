# Lab404Electronics - Security Rulebook

## Overview

This document defines mandatory security rules that MUST be followed in all code written for the Lab404Electronics platform. Every new feature, algorithm, or code change must pass the security checklist before being considered complete.

---

## Core Security Principles

### 1. Never Trust Client Input
ALL data from the client (browser, mobile app, API consumer) must be treated as potentially malicious.

```typescript
// WRONG - Trusting client-provided price
const order = {
  total: req.body.total, // NEVER DO THIS
  items: req.body.items
};

// CORRECT - Calculate everything server-side
const order = {
  total: calculateOrderTotal(req.body.items), // Calculate from DB prices
  items: validateAndSanitizeItems(req.body.items)
};
```

### 2. Defense in Depth
Apply multiple layers of security. Don't rely on a single security measure.

### 3. Principle of Least Privilege
Every component should have only the minimum permissions needed.

---

## Mandatory Security Rules

### RULE 1: Server-Side Calculation Only

**CRITICAL: All financial calculations MUST be performed server-side**

| Calculation | Client | Server |
|-------------|--------|--------|
| Product prices | Display only | Source of truth |
| Cart subtotal | Display only | Calculate |
| Tax amount | Display only | Calculate |
| Discount amount | Display only | Calculate |
| Shipping cost | Display only | Calculate |
| Order total | Display only | Calculate |

```typescript
// services/pricing.service.ts

export class PricingService {
  /**
   * Calculate cart totals - ALWAYS use this method
   * NEVER accept pre-calculated totals from client
   */
  async calculateCart(cartItems: CartItemInput[]): Promise<CartCalculation> {
    // 1. Fetch current prices from database
    const products = await this.productRepository.findByIds(
      cartItems.map(item => item.productId)
    );

    // 2. Validate all products exist and are active
    for (const item of cartItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.status !== 'active') {
        throw new ValidationError(`Invalid product: ${item.productId}`);
      }
    }

    // 3. Calculate using database prices only
    const subtotal = cartItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return sum + (product.basePrice * item.quantity);
    }, 0);

    // 4. Get tax rate from settings (not client)
    const taxRate = await this.settingsService.getTaxRate();

    // 5. Calculate remaining totals
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return { subtotal, taxRate, taxAmount, total };
  }
}
```

### RULE 2: Input Validation

**ALL inputs must be validated using Zod schemas**

```typescript
// schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .trim(),
  sku: z.string()
    .min(1, 'SKU is required')
    .max(100)
    .regex(/^[A-Z0-9-]+$/, 'Invalid SKU format'),
  basePrice: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price too high'),
  description: z.string()
    .max(10000)
    .optional()
    .transform(val => sanitizeHtml(val)), // Sanitize HTML
  categoryId: z.string().uuid(),
});

// Usage in API route
export async function POST(req: Request) {
  const body = await req.json();

  // Validate with Zod - throws if invalid
  const validatedData = createProductSchema.parse(body);

  // Now safe to use validatedData
}
```

### RULE 3: SQL Injection Prevention

**ALWAYS use parameterized queries or ORM**

```typescript
// WRONG - SQL Injection vulnerability
const query = `SELECT * FROM products WHERE name = '${userInput}'`;

// CORRECT - Using Drizzle ORM
const products = await db
  .select()
  .from(productsTable)
  .where(eq(productsTable.name, userInput));

// CORRECT - Using parameterized query
const products = await db.execute(
  sql`SELECT * FROM products WHERE name = ${userInput}`
);
```

### RULE 4: XSS Prevention

**Sanitize all user-generated content before storage and display**

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content before storing
function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// For text-only fields, strip all HTML
function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}
```

### RULE 5: Authentication & Authorization

```typescript
// middleware/auth.ts

export async function requireAuth(req: Request): Promise<AuthUser> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  // Verify with Neon Auth
  const user = await verifyNeonAuthToken(token);

  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  return user;
}

export async function requireAdmin(req: Request): Promise<AdminUser> {
  const user = await requireAuth(req);

  if (user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return user;
}

// Resource ownership check
export async function requireOwnership(
  userId: string,
  resource: { customerId: string }
): Promise<void> {
  if (resource.customerId !== userId) {
    throw new ForbiddenError('Access denied');
  }
}
```

### RULE 6: Rate Limiting

**Implement rate limiting on all public endpoints**

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function rateLimitMiddleware(
  req: Request,
  identifier: string
): Promise<void> {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new TooManyRequestsError('Rate limit exceeded', {
      limit,
      reset,
      remaining,
    });
  }
}

// Different limits for different endpoints
const RATE_LIMITS = {
  login: { requests: 5, window: '15 m' },
  register: { requests: 3, window: '1 h' },
  checkout: { requests: 10, window: '1 m' },
  productList: { requests: 100, window: '1 m' },
  search: { requests: 30, window: '1 m' },
};
```

### RULE 7: Secure Headers

```typescript
// next.config.js or middleware
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://api.lab404electronics.com;
    `.replace(/\n/g, '')
  }
];
```

### RULE 8: Sensitive Data Handling

```typescript
// NEVER log sensitive data
logger.info('User login', {
  email: user.email,
  // password: user.password, // NEVER LOG PASSWORDS
  // token: authToken, // NEVER LOG TOKENS
  timestamp: new Date(),
});

// Mask sensitive data in responses
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

// Never expose internal IDs in error messages
catch (error) {
  // WRONG
  throw new Error(`Failed to find user ${userId}`);

  // CORRECT
  throw new NotFoundError('User not found');
}
```

### RULE 9: CSRF Protection

```typescript
// For state-changing operations, validate CSRF token
import { csrf } from '@edge-csrf/nextjs';

// Generate CSRF token for forms
const csrfToken = await generateCsrfToken();

// Validate on submission
await validateCsrfToken(req.headers.get('X-CSRF-Token'));
```

### RULE 10: File Upload Security

```typescript
// Validate file uploads strictly
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function validateFileUpload(file: File): Promise<void> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('File too large');
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ValidationError('Invalid file type');
  }

  // Verify actual content matches declared type
  const buffer = await file.arrayBuffer();
  const actualType = await fileTypeFromBuffer(buffer);

  if (!actualType || !ALLOWED_IMAGE_TYPES.includes(actualType.mime)) {
    throw new ValidationError('File content does not match declared type');
  }

  // Generate new filename - never use original
  const newFilename = `${crypto.randomUUID()}.${actualType.ext}`;
}
```

---

## Security Checklist for New Features

### Before writing code:
- [ ] Identified all user inputs
- [ ] Identified sensitive data handling
- [ ] Designed with least privilege principle

### During implementation:
- [ ] All inputs validated with Zod schemas
- [ ] All database queries use ORM/parameterized queries
- [ ] No client-side calculations for sensitive values
- [ ] Proper authentication checks implemented
- [ ] Proper authorization checks implemented
- [ ] Error messages don't expose sensitive information
- [ ] Logging doesn't include sensitive data
- [ ] File uploads validated (if applicable)

### Before deployment:
- [ ] Code reviewed for security issues
- [ ] Dependency vulnerabilities checked (npm audit)
- [ ] Rate limiting implemented for public endpoints
- [ ] CORS configured correctly
- [ ] Security headers present
- [ ] Environment variables properly secured
- [ ] No hardcoded secrets

---

## Vulnerability Response Plan

### If a vulnerability is discovered:

1. **Assess severity** (Critical, High, Medium, Low)
2. **Contain** - Disable affected feature if critical
3. **Fix** - Develop and test patch
4. **Deploy** - Push fix to production
5. **Notify** - Inform affected users if data was compromised
6. **Document** - Record incident and learnings

### Severity Classifications

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Active exploitation, data breach | Immediate |
| High | Exploitable vulnerability | 24 hours |
| Medium | Potential vulnerability | 1 week |
| Low | Minor security improvement | Next release |

---

## Secure Development Environment

### Required Tools

```bash
# Install security scanning tools
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-security
npm install --save-dev snyk

# Add to package.json scripts
"security:audit": "npm audit && snyk test",
"security:lint": "eslint --ext .ts,.tsx . --plugin security"
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run security:lint
npm run security:audit --audit-level=high
```

---

## Compliance

- GDPR compliance for EU customers
- PCI DSS awareness (even with COD, card data may come later)
- Data retention policies
- Right to deletion support

---

**Last Updated:** 2025-12-28
**Next Review:** 2026-01-28
**Owner:** Development Team
