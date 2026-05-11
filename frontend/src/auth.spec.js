import { test, expect } from '@playwright/test';

test('Auth page loads correctly and displays elements', async ({ page }) => {
  // Go to the auth page
  await page.goto('/auth');

  // Verify the main title is visible
  await expect(page.locator('text=InternConnect').first()).toBeVisible();
  await expect(page.locator('text=Graph-powered career matching')).toBeVisible();

  // Verify login and register tabs exist
  await expect(page.locator('button:has-text("login")')).toBeVisible();
  await expect(page.locator('button:has-text("register")')).toBeVisible();
});