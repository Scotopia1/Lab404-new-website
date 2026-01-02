/**
 * API Test Runner
 * Runs all API endpoint tests and generates a report
 */

import { apiRequest, runTest, TestResult, TestSuiteResult, assert, assertStatus, assertExists } from './setup';
import { checkDbHealth, verifySchema } from '../src/utils/db-health';

// Store tokens for authenticated requests
let customerToken: string | null = null;
let adminToken: string | null = null;
let testProductId: string | null = null;
let testCategoryId: string | null = null;
let testCustomerId: string | null = null;

// ===========================================
// Database Tests
// ===========================================

async function runDatabaseTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Database connection', async () => {
    const health = await checkDbHealth();
    assert(health.connected, `Database not connected: ${health.error}`);
    console.log(`  ✓ Connected to PostgreSQL (latency: ${health.latency}ms)`);
  }));

  tests.push(await runTest('Schema verification', async () => {
    const schema = await verifySchema();
    if (!schema.valid) {
      console.log(`  Missing tables: ${schema.missingTables.join(', ')}`);
    }
    assert(schema.valid, `Missing tables: ${schema.missingTables.join(', ')}`);
    console.log(`  ✓ All ${17 - schema.missingTables.length} required tables exist`);
  }));

  return {
    suite: 'Database',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Health & API Info Tests
// ===========================================

async function runHealthTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('API root endpoint', async () => {
    const res = await apiRequest('GET', '/');
    assertStatus(res.status, 200);
    assert((res.data as any).name === 'Lab404Electronics API', 'API name mismatch');
  }));

  tests.push(await runTest('Health check endpoint', async () => {
    const res = await apiRequest('GET', '/health');
    assertStatus(res.status, 200);
    assert((res.data as any).status === 'ok', 'Health check failed');
  }));

  return {
    suite: 'Health',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Auth Tests
// ===========================================

async function runAuthTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  tests.push(await runTest('Register new customer', async () => {
    const res = await apiRequest('POST', '/auth/register', {
      body: {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    assertStatus(res.status, 201);
    assertExists((res.data as any).data?.token);
    customerToken = (res.data as any).data.token;
    testCustomerId = (res.data as any).data.customerId;
  }));

  tests.push(await runTest('Register with existing email (should fail)', async () => {
    const res = await apiRequest('POST', '/auth/register', {
      body: {
        email: testEmail,
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    assertStatus(res.status, 409); // Conflict
  }));

  tests.push(await runTest('Register with invalid email (should fail)', async () => {
    const res = await apiRequest('POST', '/auth/register', {
      body: {
        email: 'invalid-email',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    assertStatus(res.status, 422); // Zod validation error
  }));

  tests.push(await runTest('Register with weak password (should fail)', async () => {
    const res = await apiRequest('POST', '/auth/register', {
      body: {
        email: 'new@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    assertStatus(res.status, 422); // Zod validation error
  }));

  tests.push(await runTest('Login with valid credentials', async () => {
    const res = await apiRequest('POST', '/auth/login', {
      body: { email: testEmail, password: testPassword },
    });
    assertStatus(res.status, 200);
    assertExists((res.data as any).data?.token);
  }));

  tests.push(await runTest('Login with invalid password (should fail)', async () => {
    const res = await apiRequest('POST', '/auth/login', {
      body: { email: testEmail, password: 'WrongPassword123!' },
    });
    // Accept 401 (Unauthorized) or 429 (Rate limited) as valid failure
    assert(res.status === 401 || res.status === 429, `Expected 401 or 429, got ${res.status}`);
  }));

  tests.push(await runTest('Login with non-existent email (should fail)', async () => {
    const res = await apiRequest('POST', '/auth/login', {
      body: { email: 'nonexistent@example.com', password: testPassword },
    });
    // Accept 401 (Unauthorized) or 429 (Rate limited) as valid failure
    assert(res.status === 401 || res.status === 429, `Expected 401 or 429, got ${res.status}`);
  }));

  return {
    suite: 'Authentication',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Category Tests
// ===========================================

async function runCategoryTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get categories (public)', async () => {
    const res = await apiRequest('GET', '/categories');
    assertStatus(res.status, 200);
    assert(Array.isArray((res.data as any).data), 'Categories should be an array');
  }));

  tests.push(await runTest('Create category without auth (should fail)', async () => {
    const res = await apiRequest('POST', '/categories', {
      body: { name: 'Test Category' },
    });
    assertStatus(res.status, 401);
  }));

  // Admin category tests would require admin token
  // Skipping creation tests without admin auth

  return {
    suite: 'Categories',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Product Tests
// ===========================================

async function runProductTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get products (public)', async () => {
    const res = await apiRequest('GET', '/products');
    assertStatus(res.status, 200);
    assert(Array.isArray((res.data as any).data), 'Products should be an array');
  }));

  tests.push(await runTest('Get products with pagination', async () => {
    const res = await apiRequest('GET', '/products?page=1&limit=10');
    assertStatus(res.status, 200);
    assert((res.data as any).meta !== undefined, 'Should have pagination meta');
  }));

  tests.push(await runTest('Get products with search', async () => {
    const res = await apiRequest('GET', '/products?search=test');
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Get non-existent product (should fail)', async () => {
    const res = await apiRequest('GET', '/products/00000000-0000-0000-0000-000000000000');
    assertStatus(res.status, 404);
  }));

  tests.push(await runTest('Create product without auth (should fail)', async () => {
    const res = await apiRequest('POST', '/products', {
      body: { name: 'Test Product', sku: 'TEST-001', basePrice: 99.99 },
    });
    assertStatus(res.status, 401);
  }));

  return {
    suite: 'Products',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Cart Tests
// ===========================================

async function runCartTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get cart (anonymous)', async () => {
    const res = await apiRequest('GET', '/cart');
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Get cart calculation (empty)', async () => {
    const res = await apiRequest('GET', '/cart/calculate');
    assertStatus(res.status, 200);
    assert((res.data as any).data.total === 0, 'Empty cart should have 0 total');
  }));

  tests.push(await runTest('Add invalid product to cart (should fail)', async () => {
    const res = await apiRequest('POST', '/cart/items', {
      body: {
        productId: '00000000-0000-0000-0000-000000000000',
        quantity: 1,
      },
    });
    assertStatus(res.status, 404);
  }));

  tests.push(await runTest('Add item with invalid quantity (should fail)', async () => {
    const res = await apiRequest('POST', '/cart/items', {
      body: {
        productId: '00000000-0000-0000-0000-000000000000',
        quantity: -1,
      },
    });
    assertStatus(res.status, 422); // Zod validation error
  }));

  return {
    suite: 'Cart',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Order Tests
// ===========================================

async function runOrderTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Create order without cart (should fail)', async () => {
    const res = await apiRequest('POST', '/orders', {
      body: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '123 Test St',
          city: 'Test City',
          country: 'US',
        },
        customerEmail: 'test@example.com',
      },
    });
    // Should fail because cart is empty
    assertStatus(res.status, 400);
  }));

  tests.push(await runTest('Track non-existent order (should fail)', async () => {
    const res = await apiRequest('GET', '/orders/track/INVALID-ORDER-123');
    assertStatus(res.status, 404);
  }));

  tests.push(await runTest('Get orders without auth (should fail)', async () => {
    const res = await apiRequest('GET', '/orders');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Get orders with auth', async () => {
    if (!customerToken) {
      throw new Error('No customer token available');
    }
    const res = await apiRequest('GET', '/orders', { token: customerToken });
    assertStatus(res.status, 200);
  }));

  return {
    suite: 'Orders',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Customer Tests
// ===========================================

async function runCustomerTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get profile without auth (should fail)', async () => {
    const res = await apiRequest('GET', '/customers/me');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Get profile with auth', async () => {
    if (!customerToken) {
      throw new Error('No customer token available');
    }
    const res = await apiRequest('GET', '/customers/me', { token: customerToken });
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Update profile with auth', async () => {
    if (!customerToken) {
      throw new Error('No customer token available');
    }
    const res = await apiRequest('PUT', '/customers/me', {
      token: customerToken,
      body: { firstName: 'Updated' },
    });
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Get addresses with auth', async () => {
    if (!customerToken) {
      throw new Error('No customer token available');
    }
    const res = await apiRequest('GET', '/customers/me/addresses', { token: customerToken });
    assertStatus(res.status, 200);
  }));

  return {
    suite: 'Customers',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Promo Code Tests
// ===========================================

async function runPromoCodeTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Validate invalid promo code', async () => {
    const res = await apiRequest('POST', '/promo-codes/validate', {
      body: { code: 'INVALID-CODE', orderAmount: 100 },
    });
    assertStatus(res.status, 400);
  }));

  tests.push(await runTest('Get promo codes without admin auth (should fail)', async () => {
    const res = await apiRequest('GET', '/promo-codes');
    assertStatus(res.status, 401);
  }));

  return {
    suite: 'Promo Codes',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Blog Tests
// ===========================================

async function runBlogTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get blogs (public)', async () => {
    const res = await apiRequest('GET', '/blogs');
    assertStatus(res.status, 200);
    assert(Array.isArray((res.data as any).data), 'Blogs should be an array');
  }));

  tests.push(await runTest('Get blog tags', async () => {
    const res = await apiRequest('GET', '/blogs/tags');
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Get non-existent blog (should fail)', async () => {
    const res = await apiRequest('GET', '/blogs/non-existent-slug');
    assertStatus(res.status, 404);
  }));

  tests.push(await runTest('Create blog without auth (should fail)', async () => {
    const res = await apiRequest('POST', '/blogs', {
      body: { title: 'Test Blog', content: 'Test content' },
    });
    assertStatus(res.status, 401);
  }));

  return {
    suite: 'Blogs',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Settings Tests
// ===========================================

async function runSettingsTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Get public settings', async () => {
    const res = await apiRequest('GET', '/settings/public');
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Get all settings without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/settings');
    assertStatus(res.status, 401);
  }));

  return {
    suite: 'Settings',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Contact Tests
// ===========================================

async function runContactTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Submit contact form', async () => {
    const res = await apiRequest('POST', '/contact', {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with more than 10 characters.',
      },
    });
    assertStatus(res.status, 200);
  }));

  tests.push(await runTest('Submit contact with invalid email (should fail)', async () => {
    const res = await apiRequest('POST', '/contact', {
      body: {
        name: 'Test User',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This is a test message.',
      },
    });
    assertStatus(res.status, 422); // Zod validation error
  }));

  tests.push(await runTest('Submit newsletter subscription', async () => {
    const res = await apiRequest('POST', '/contact/newsletter', {
      body: { email: 'newsletter@example.com' },
    });
    assertStatus(res.status, 200);
  }));

  return {
    suite: 'Contact',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Admin Routes Tests (Require Admin Auth)
// ===========================================

async function runAdminTests(): Promise<TestSuiteResult> {
  const tests: TestResult[] = [];
  const start = Date.now();

  // Test admin-protected routes without auth
  tests.push(await runTest('Access analytics without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/analytics/dashboard');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Access quotations without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/quotations');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Access export without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/export/products');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Access import without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/import/jobs');
    assertStatus(res.status, 401);
  }));

  tests.push(await runTest('Access upload without admin (should fail)', async () => {
    const res = await apiRequest('GET', '/upload/auth');
    assertStatus(res.status, 401);
  }));

  // Test with customer token (should also fail - wrong role)
  if (customerToken) {
    tests.push(await runTest('Access admin routes with customer token (should fail)', async () => {
      const res = await apiRequest('GET', '/analytics/dashboard', { token: customerToken! });
      assertStatus(res.status, 403);
    }));
  }

  return {
    suite: 'Admin Routes',
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    skipped: 0,
    duration: Date.now() - start,
    tests,
  };
}

// ===========================================
// Main Test Runner
// ===========================================

export async function runAllTests(): Promise<{
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  duration: number;
  suites: TestSuiteResult[];
}> {
  console.log('\n🧪 Lab404 Electronics API Test Suite\n');
  console.log('='.repeat(60) + '\n');

  const start = Date.now();
  const suites: TestSuiteResult[] = [];

  // Run all test suites
  const testFunctions = [
    runDatabaseTests,
    runHealthTests,
    runAuthTests,
    runCategoryTests,
    runProductTests,
    runCartTests,
    runOrderTests,
    runCustomerTests,
    runPromoCodeTests,
    runBlogTests,
    runSettingsTests,
    runContactTests,
    runAdminTests,
  ];

  for (const testFn of testFunctions) {
    try {
      const result = await testFn();
      suites.push(result);

      const icon = result.failed === 0 ? '✅' : '❌';
      console.log(`${icon} ${result.suite}: ${result.passed}/${result.passed + result.failed} passed`);

      if (result.failed > 0) {
        for (const test of result.tests.filter(t => !t.passed)) {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${testFn.name}: Suite failed - ${error}`);
    }
  }

  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
  const totalSkipped = suites.reduce((sum, s) => sum + s.skipped, 0);

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${totalPassed + totalFailed} tests`);
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log(`   ⏱️ Duration: ${Date.now() - start}ms\n`);

  return {
    totalPassed,
    totalFailed,
    totalSkipped,
    duration: Date.now() - start,
    suites,
  };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(result => {
      process.exit(result.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}
