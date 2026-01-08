# Testing Practices

## Test Framework Overview

### Backend Testing

**Custom Test Runner:**
- TypeScript-based test runner (`tests/run-tests.ts`)
- No traditional test framework (Jest, Vitest, Mocha)
- Manual test implementation using custom utilities
- Integration test focused approach

### Frontend Testing

**Playwright:**
- E2E testing framework for admin app
- Version: `@playwright/test: ^1.57.0`
- Configuration: Chromium browser, HTML reports
- Trace on failure for debugging

**Cypress:**
- E2E testing for website (version 15.8.1)
- Not actively used based on codebase review

## Test Organization

### Backend Tests (`apps/api/tests/`)

```
tests/
├── run-tests.ts         # Main test runner with all suites
├── security-audit.ts    # Security-specific tests
├── setup.ts             # Test utilities and helpers
└── index.ts             # Export entry point
```

**Test Suite Structure:**
```typescript
async function runDatabaseTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Test name', async () => {
    const res = await apiRequest('GET', '/endpoint');
    assertStatus(res.status, 200);
    assert(condition, 'error message');
  }));

  return {
    suite: 'SuiteName',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}
```

### Frontend Tests (`apps/admin/tests/`)

```
tests/
├── auth.spec.ts         # Authentication E2E tests
├── customers.spec.ts    # Customer management tests
├── dashboard.spec.ts    # Dashboard tests
├── navigation.spec.ts   # Navigation tests
└── fixtures.ts          # Test data and helpers
```

**Playwright Test Structure:**
```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('AUTH-001: Test name', async ({ page }) => {
    // Test implementation
  });
});
```

## Test Coverage

### Backend API Tests

**Test Suites:**

1. **Database Connectivity:**
   - Connection validation
   - Schema validation
   - Query execution

2. **Health Checks:**
   - API health endpoint
   - Database health check

3. **Authentication:**
   - User registration
   - Login (user + admin)
   - Token validation
   - Logout

4. **Products:**
   - List products
   - Get product by ID
   - Create product
   - Update product
   - Delete product
   - Product variants

5. **Categories:**
   - List categories
   - Create category
   - Hierarchical relationships

6. **Orders:**
   - List orders
   - Get order by ID
   - Create order (checkout)
   - Update order status

7. **Cart:**
   - Add to cart
   - Update cart item
   - Remove from cart
   - Calculate totals

8. **Promotions:**
   - Validate promo code
   - Apply discount
   - Promo code restrictions

9. **Admin Routes:**
   - Analytics endpoints
   - Export functionality
   - Import functionality

**Status Code Testing:**
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict
- 422: Validation error
- 429: Too many requests

### Frontend E2E Tests

**Coverage Areas:**

1. **Authentication Flow:**
   - Login page loads
   - Form validation
   - Successful login
   - Failed login
   - Redirect after login
   - Logout

2. **Dashboard:**
   - Page loads
   - Analytics visible
   - Navigation works

3. **Customer Management:**
   - List customers
   - View customer details
   - Edit customer
   - Search/filter

4. **Navigation:**
   - Sidebar links work
   - Protected routes redirect
   - Breadcrumbs update

**Test IDs:**
- `AUTH-001`, `AUTH-002` - Traceability
- Sequential numbering per feature

### Security Testing

**Custom Security Audit (`security-audit.ts`):**

**Categories:**

1. **Authentication Security:**
   - Weak password rejection
   - SQL injection attempts
   - Brute force protection
   - Token leak prevention

2. **Input Validation:**
   - XSS prevention
   - SQL injection prevention
   - Command injection prevention

3. **Rate Limiting:**
   - Auth endpoint limits
   - API endpoint limits

**Severity Levels:**
- Critical
- High
- Medium
- Low
- Info

**Example Test:**
```typescript
// Weak password rejection
const res = await register({
  email: `test-${Date.now()}@example.com`,
  password: 'password123',  // Common weak password
});

const rejected = res.status === 400 || res.status === 422;
results.push({
  category: 'Authentication',
  check: 'Weak password rejection',
  passed: rejected,
  severity: 'critical',
  details: rejected ? 'Rejected' : 'VULNERABLE: Accepted!',
});
```

## Testing Strategies

### Integration Testing (Backend)

**Approach:**
- Tests use real database and API
- No mocking of database or HTTP layer
- Creates actual test data
- Uses real Express server

**Data Handling:**
```typescript
// Create unique test data
const testEmail = `test-${Date.now()}@example.com`;

// No cleanup - data may persist
// Tests create isolated data with timestamps
```

**Benefits:**
- Tests real system behavior
- Catches integration issues
- Validates actual database schema

**Drawbacks:**
- Slower than unit tests
- May leave test data
- Requires database access

### E2E Testing (Frontend)

**Approach:**
- Tests real user workflows
- Uses real API endpoints
- Clears state between tests

**State Management:**
```typescript
test.beforeEach(async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());

  // Clear cookies
  await page.context().clearCookies();
});
```

**Page Objects Pattern:**
```typescript
// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', ADMIN_EMAIL);
  await page.fill('[name="password"]', ADMIN_PASSWORD);
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

## Test Utilities

### Backend Utilities (`setup.ts`)

**HTTP Client:**
```typescript
apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options?: {
    body?: any;
    token?: string;
    headers?: Record<string, string>;
  }
): Promise<Response>
```

**Assertion Helpers:**
```typescript
assert(condition: boolean, message: string): void
assertEqual<T>(actual: T, expected: T, message?: string): void
assertStatus(actual: number, expected: number): void
assertExists<T>(value: T | null | undefined, message?: string): void
```

**Test Runner:**
```typescript
runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult>
```

**Configuration:**
```typescript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:4000',
  timeout: 30000,
  testUser: {
    email: 'test@example.com',
    password: 'Test123456'
  },
  testAdmin: {
    email: 'admin@lab404electronics.com',
    password: 'Admin123456'
  }
};
```

### Frontend Fixtures (`fixtures.ts`)

**Test Credentials:**
```typescript
const ADMIN_EMAIL = 'admin@lab404electronics.com';
const ADMIN_PASSWORD = 'Admin123456';
```

**Helper Functions:**
```typescript
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.fill('[name="email"]', ADMIN_EMAIL);
  await page.fill('[name="password"]', ADMIN_PASSWORD);
  await page.click('[type="submit"]');
  await page.waitForURL('/dashboard');
}
```

## Test Execution

### Running Tests

**Backend:**
```bash
npm run test              # Run main test suite
npm run test:security     # Run security audit
npm run test:all          # Run both
```

**Frontend (Admin):**
```bash
npm run test              # Run Playwright tests
```

### Playwright Configuration

```javascript
{
  testDir: './tests',
  fullyParallel: false,       // Serial execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,                 // Single worker
  reporter: ['html', 'list'],
  timeout: 60000,             // 60 seconds
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
}
```

### CI/CD Integration

**CI Detection:**
```typescript
const isCI = !!process.env.CI;
```

**CI Behavior:**
- Playwright: 2 retries, forbid .only
- More strict error handling
- Automated test reports

**Artifacts:**
- Playwright HTML reports: `test-results/`
- Screenshots on failure
- Video on failure
- Trace on first retry

## Testing Philosophy

### Current Approach

**Integration Over Unit:**
- Focus on integration tests
- Test real system behavior
- Less mocking, more real data
- Pragmatic over comprehensive

**Reasons:**
- Faster to implement
- Tests actual production paths
- Catches more real bugs
- Simpler to maintain

**Trade-offs:**
- Slower execution
- Requires running services
- Less isolation
- May leave test data

### Coverage Gaps

**Missing Tests:**

1. **Unit Tests:**
   - No unit tests for services
   - PricingService calculations (critical)
   - Authorization logic

2. **Edge Cases:**
   - Concurrent operations
   - Large data sets
   - Performance testing

3. **Error Scenarios:**
   - Database failures
   - Network timeouts
   - External API failures

4. **Frontend Unit Tests:**
   - Component testing
   - Hook testing
   - Utility function testing

### Testing Best Practices

**Do:**
- Test critical business logic
- Test security-sensitive operations
- Test user workflows
- Test error handling
- Use unique test data
- Clear state between tests

**Don't:**
- Test implementation details
- Mock too much
- Leave unused test code
- Ignore flaky tests
- Test framework internals

## Test Data Management

### Backend Test Data

**Creation:**
```typescript
// Unique identifiers
const testEmail = `test-${Date.now()}@example.com`;
const testSKU = `TEST-${Date.now()}`;
```

**Isolation:**
- Each test creates own data
- Timestamps prevent conflicts
- No shared state between tests

**Cleanup:**
- Not currently implemented
- Test data may persist
- Could cause database bloat

### Frontend Test Data

**Mock Data:**
- Admin credentials hardcoded
- Test products created via API
- Uses real backend data

**State Reset:**
```typescript
// Clear client state
localStorage.clear();
context.clearCookies();
```

## Recommendations

### Short Term

1. **Add Test Cleanup:**
   - Delete test data after tests
   - Transaction rollback pattern
   - Isolated test databases

2. **Unit Tests for Critical Logic:**
   - PricingService calculations
   - Authorization checks
   - Data transformations

3. **More Security Tests:**
   - XSS prevention
   - CSRF protection
   - Input sanitization

### Long Term

1. **Move to Standard Framework:**
   - Vitest for backend unit tests
   - Keep Playwright for E2E

2. **Increase Coverage:**
   - Aim for 80%+ on critical paths
   - Add performance tests
   - Add load tests

3. **CI/CD Integration:**
   - Run tests on every commit
   - Block merges on failures
   - Automated deployment on success
