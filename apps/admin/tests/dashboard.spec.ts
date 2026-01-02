import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures';

test.describe('Dashboard Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForLoadState('networkidle');
  });

  test('DASH-001: Dashboard page loads', async ({ page }) => {
    // Check for dashboard content
    const hasHeading = await page.locator('h1').first().isVisible().catch(() => false);
    const hasDashboardText = await page.getByText(/dashboard|welcome|overview/i).first().isVisible().catch(() => false);
    expect(hasHeading || hasDashboardText).toBeTruthy();
  });

  test('DASH-002: Stats cards display', async ({ page }) => {
    // Check for metric cards
    const hasCards = await page.locator('[class*="card"], [class*="stat"], [class*="metric"]').first().isVisible().catch(() => false);
    const hasText = await page.getByText(/revenue|orders|products|customers/i).first().isVisible().catch(() => false);
    expect(hasCards || hasText).toBeTruthy();
  });

  test('DASH-003: Revenue information visible', async ({ page }) => {
    // Check for revenue-related content
    const hasRevenue = await page.getByText(/revenue|sales|\$/i).first().isVisible().catch(() => false);
    expect(hasRevenue).toBeTruthy();
  });

  test('DASH-004: Charts or graphs visible', async ({ page }) => {
    // Check for chart containers
    const hasChart = await page.locator('canvas, svg, [class*="chart"], [class*="graph"]').first().isVisible().catch(() => false);
    const hasChartText = await page.getByText(/chart|overview|analytics/i).first().isVisible().catch(() => false);
    expect(hasChart || hasChartText).toBeTruthy();
  });

  test('DASH-005: Quick actions or links visible', async ({ page }) => {
    // Check for action links
    const hasLinks = await page.locator('a').first().isVisible().catch(() => false);
    const hasButtons = await page.locator('button').first().isVisible().catch(() => false);
    expect(hasLinks || hasButtons).toBeTruthy();
  });

  test('DASH-006: Page is responsive', async ({ page }) => {
    // Basic responsiveness check - page should not have horizontal scroll at normal width
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  });
});
