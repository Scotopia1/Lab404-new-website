/**
 * Test Setup and Utilities
 * Configures the test environment for API testing
 */

import { config } from '../src/config';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: `http://localhost:${config.port}/api`,
  timeout: 10000,
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  testAdmin: {
    email: 'admin@lab404.com',
    password: 'AdminPassword123!',
  },
};

// HTTP client helper
export async function apiRequest(
  method: string,
  path: string,
  options: {
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  data: unknown;
  headers: Headers;
}> {
  const url = `${TEST_CONFIG.baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

// Test result tracking
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

export interface TestSuiteResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

// Test runner helper
export async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Assertion helpers
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertStatus(actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(`Expected status ${expected}, got ${actual}`);
  }
}

export function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should exist but is null/undefined');
  }
}
