# Coding Conventions

## Code Style & Formatting

### TypeScript Configuration

**Strict Mode Enabled:**
- `"strict": true` in all tsconfig files
- Catches null/undefined issues
- Requires explicit return types for exports
- No implicit any types

**Additional Strict Flags:**
- `noUncheckedIndexAccess` - Requires checks on indexed properties
- `noImplicitOverride` - Requires override keyword
- `noPropertyAccessFromIndexSignature` - Strict property access

### Linting & Formatting

**ESLint:**
- ESLint 9 with Next.js configuration
- Frontend apps use Next.js linting rules
- No dedicated Prettier config
- Relies on ESLint + editor defaults

**Indentation:**
- 2 spaces for all TypeScript/JavaScript
- Consistent across all apps
- No tabs

**Spacing:**
- Clean spacing around imports
- Section separation with comment headers
- Consistent line breaks

## Naming Conventions

### Variables & Constants

**Variables:**
```typescript
// camelCase for variables and functions
const customerToken = generateToken();
const isValid = validateEmail(email);
```

**Constants:**
```typescript
// UPPER_SNAKE_CASE for constant arrays
const WEAK_PASSWORDS = ['password123', 'admin', 'test'];

// camelCase for config objects
const apiConfig = { port: 4000, timeout: 30000 };
```

### Functions & Methods

**Verb-Based Naming:**
```typescript
// Action verbs
createOrder()
getCustomer()
sendEmail()
validateToken()
updateProduct()

// Utility prefixes
sanitizeEmail()
isStrongPassword()
formatPrice()
```

**Middleware Naming:**
```typescript
// Descriptive action names
requireAuth()
optionalAuth()
validateBody()
checkPermissions()
```

### Classes & Types

**Classes:**
```typescript
// PascalCase for classes
class Logger { }
class MailerService { }
class PricingService { }
```

**Error Classes:**
```typescript
// *Error suffix
class ApiError extends Error { }
class ValidationError extends ApiError { }
class UnauthorizedError extends ApiError { }
```

**Interfaces & Types:**
```typescript
// PascalCase, descriptive names
interface AuthState { }
interface CartTotals { }
interface EmailOptions { }

// Type inference from Zod
type LoginFormData = z.infer<typeof loginSchema>;
```

### Files & Directories

**Backend Files:**
```
auth.routes.ts        # Routes: kebab-case.routes.ts
pricing.service.ts    # Services: camelCase.service.ts
logger.ts             # Utilities: camelCase.ts
```

**Frontend Files:**
```
LoginForm.tsx         # Components: PascalCase.tsx
use-cart.ts          # Hooks: use-*.ts
api-client.ts        # Utilities: kebab-case.ts
```

**Test Files:**
```
auth.spec.ts         # Playwright: *.spec.ts
```

**Directories:**
```
promo-codes/         # kebab-case
(auth)/              # Next.js route groups: (name)/
```

### Database Naming

**Tables:**
```sql
-- Lowercase with underscores
customers
cart_items
order_items
promo_codes
```

**Columns:**
```sql
-- snake_case in database
first_name
created_at
is_active

-- camelCase in TypeScript
firstName
createdAt
isActive
```

**Foreign Keys:**
```typescript
// {tableName}Id pattern
customerId
productId
orderId
```

## Import/Export Patterns

### Backend Exports

```typescript
// Named exports for route handlers
export const authRoutes = Router();

// Named exports from utils
export { logger } from './utils/logger';
export { generateToken, requireAuth } from './middleware/auth';

// Re-export pattern in index files
export { createDb, getDb, Database } from './client';
```

### Frontend Exports

```typescript
// Default exports for page components
export default function LoginPage() { }

// Named exports for components
export function LoginForm() { }

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
```

### Path Aliases

**Backend:**
```typescript
// @/* → src/*
import { logger } from '@/utils/logger';
import { db } from '@lab404/database';
import type { Product } from '@lab404/shared-types';
```

**Frontend:**
```typescript
// @/* → src/*
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
```

## Error Handling

### Custom Error Classes

**Hierarchy:**
```typescript
ApiError (base)
├── BadRequestError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (422)
├── TooManyRequestsError (429)
└── InternalServerError (500)
```

**Usage:**
```typescript
// Throw specific errors
if (!user) {
  throw new NotFoundError('User not found');
}

if (existing && !existing.isGuest) {
  throw new ConflictError('Email already registered');
}
```

### Error Handling Pattern

```typescript
// Try-catch with next() for Express
try {
  // Route handler logic
} catch (error) {
  next(error);  // Caught by global error handler
}
```

## Logging

### Logger Usage

**Log Levels:**
```typescript
logger.debug('Debug info', { context });  // Dev only
logger.info('Operation success', { data });
logger.warn('Warning condition', { details });
logger.error('Error occurred', error, { context });
logger.http('HTTP request', { method, path });
```

**Format:**
```
[2024-01-08T10:30:15.123Z] [INFO] SMTP mailer initialized {"host":"smtp.gmail.com","port":587}
```

**Context Objects:**
```typescript
// Always include relevant context
logger.error('Request error', err, {
  method: req.method,
  path: req.path,
  ip: req.ip
});
```

### Where to Log

- **Services:** Initialization and failures
- **Middleware:** Auth failures, rate limiting
- **Routes:** Business logic errors
- **Error Handler:** All unhandled errors

## Documentation

### Code Comments

**Section Headers:**
```typescript
// ===========================================
// Route Definitions
// ===========================================
```

**JSDoc for Public APIs:**
```typescript
/**
 * Extract JWT token from Authorization header
 * @param req Express request object
 * @returns Token string or null
 */
function extractToken(req: Request): string | null {
  // Implementation
}
```

**Inline Comments:**
```typescript
// Only for non-obvious logic
const hash = await bcrypt.hash(password, 12); // 12 rounds for security

// Not for obvious code
const user = await db.query.customers.findFirst(); // ❌ Don't do this
```

### File Headers

```typescript
// No file headers required
// Code should be self-documenting
```

## Type System Usage

### Generic Types

```typescript
// Response handlers use generics
sendSuccess<T>(res: Response, data: T) { }

// Hook queries use generics
useQuery<CartTotals>(['cart'], fetchCart);

// Schema inference
type LoginData = z.infer<typeof loginSchema>;
```

### Type vs Interface

**Preference for Interfaces:**
```typescript
// Use interface for object shapes
interface Customer {
  id: string;
  email: string;
  firstName: string;
}

// Use type for unions, primitives
type Status = 'pending' | 'active' | 'completed';
type UUID = string;
```

### Type Definitions

**Shared Types:**
- Domain types in `packages/shared-types`
- One file per domain (auth.ts, product.ts)
- Export all types

**Local Types:**
- Component-specific types in same file
- Utility types in `types/` directory

## React Patterns

### Component Structure

```typescript
'use client'; // Client Components directive at top

// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface LoginFormProps {
  onSubmit: (data: LoginData) => void;
}

// Component
export function LoginForm({ onSubmit }: LoginFormProps) {
  // Hooks
  const [email, setEmail] = useState('');

  // Handlers
  const handleSubmit = () => { };

  // Render
  return <form>...</form>;
}
```

### Hook Naming

```typescript
// Custom hooks start with 'use'
useCart()
useAuth()
useProducts()
useDebounce()
```

### State Management

```typescript
// Zustand stores
const useAuthStore = create<AuthState>((set) => ({
  // State
  user: null,

  // Actions
  setUser: (user) => set({ user }),
}));

// React Query
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

## Validation

### Zod Schemas

```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

// Infer type
type LoginData = z.infer<typeof loginSchema>;

// Validate
const result = loginSchema.safeParse(data);
if (!result.success) {
  // Handle errors
}
```

### Backend Validation

```typescript
// Middleware pattern
router.post('/login',
  validateBody(loginSchema),  // Validate first
  async (req, res, next) => {
    // req.body is now typed
  }
);
```

## Constants & Configuration

### Magic Numbers

**Currently:**
```typescript
// Magic numbers in code (needs improvement)
bcrypt.hash(password, 12)  // 12 rounds
rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
```

**Should Be:**
```typescript
// Define constants
const BCRYPT_ROUNDS = 12;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 100;
```

### Environment Variables

```typescript
// Centralized config
export const config = {
  port: process.env['API_PORT'] || '4000',
  jwtSecret: process.env['JWT_SECRET'] || 'fallback',  // ⚠️ Should require
  database: {
    url: process.env['DATABASE_URL'] || '',
  },
};
```

## Best Practices

1. **Type Safety:** Use TypeScript strict mode, avoid `any`
2. **Validation:** Validate at boundaries (API, forms)
3. **Error Handling:** Use custom error classes
4. **Logging:** Include context, use appropriate levels
5. **Comments:** Only for non-obvious logic
6. **Naming:** Be descriptive, follow conventions
7. **Imports:** Use path aliases, organize imports
8. **Functions:** Single responsibility, pure when possible
9. **Components:** Small, focused, reusable
10. **State:** Lift state appropriately, use appropriate tool
