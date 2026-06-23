import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Demo Mode Smoke Tests', () => {

  test('landing page loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('text=GUILD_OS').first()).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('demo — dashboard loads with data', async ({ page }) => {
    await page.goto(`${BASE}/dashboard?demo=true`);
    await expect(page.locator('text=DEMO MODE').first()).toBeVisible({ timeout: 10000 });
  });

  test('demo — inventory page loads with items', async ({ page }) => {
    await page.goto(`${BASE}/inventory?demo=true`);
    await expect(page.locator('text=DEMO MODE').first()).toBeVisible({ timeout: 10000 });
  });

  test('demo — bounty board loads', async ({ page }) => {
    await page.goto(`${BASE}/bounty-board?demo=true`);
    await expect(page.locator('text=DEMO MODE').first()).toBeVisible({ timeout: 10000 });
  });

  test('demo — nexus loads', async ({ page }) => {
    await page.goto(`${BASE}/nexus?demo=true`);
    await expect(page.locator('text=DEMO MODE').first()).toBeVisible({ timeout: 10000 });
  });

  test('demo — navigation persists demo param', async ({ page }) => {
    await page.goto(`${BASE}/dashboard?demo=true`);
    await page.waitForSelector('text=DEMO MODE', { timeout: 10000 });
    const invLink = page.locator('a[href*="inventory"]').first();
    if (await invLink.isVisible()) {
      await invLink.click();
      await page.waitForURL('**/inventory?demo=true', { timeout: 10000 });
      expect(page.url()).toContain('demo=true');
    }
  });

  test('demo — API returns phantom data', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/inventory?demo=true`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.source).toBe('demo');
    expect(json.count).toBeGreaterThan(0);
  });
});

test.describe('Production Mode Tests', () => {

  test('API — system mode reports production without demo', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/system/mode`);
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.mode).toBe('production');
  });

  test('login page has sign-in form fields', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });
});
