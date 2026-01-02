import { Page, expect } from '@playwright/test';

// Test credentials
export const ADMIN_EMAIL = 'admin@lab404electronics.com';
export const ADMIN_PASSWORD = 'Lab404Admin2024!';

// Helper function to login as admin
export async function loginAsAdmin(page: Page) {
  // Navigate to login and clear any existing auth state
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Reload after clearing localStorage
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for the form to be ready
  const emailInput = page.getByLabel(/email/i);
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  // Clear and fill email
  await emailInput.clear();
  await emailInput.fill(ADMIN_EMAIL);

  // Clear and fill password
  const passwordInput = page.getByLabel(/password/i);
  await passwordInput.clear();
  await passwordInput.fill(ADMIN_PASSWORD);

  // Click sign in button
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation to dashboard
  await expect(page).toHaveURL('/', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}
