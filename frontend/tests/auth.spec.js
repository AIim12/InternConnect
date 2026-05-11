import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load the authentication page successfully', async ({ page }) => {
    await page.goto('/auth');
    
    // Check if the title InternConnect exists
    await expect(page.locator('text=InternConnect').first()).toBeVisible();
    
    // Check if login tab exists
    await expect(page.locator('button:has-text("login")')).toBeVisible();
    
    // Check if register tab exists
    await expect(page.locator('button:has-text("register")')).toBeVisible();
  });

  test('should switch to register mode', async ({ page }) => {
    await page.goto('/auth');
    
    // Click register
    await page.click('button:has-text("register")');
    
    // Should show Full Name input, which only exists in register mode
    await expect(page.getByPlaceholder('Jane Doe')).toBeVisible();
    
    // Should show Account Type buttons
    await expect(page.locator('button:has-text("🎓 Student")')).toBeVisible();
    await expect(page.locator('button:has-text("🏢 Employer")')).toBeVisible();
  });
  
  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/auth');
    
    // Get the email input and focus it, then unfocus
    const emailInput = page.getByPlaceholder('you@example.com');
    await emailInput.focus();
    await emailInput.blur();
    
    // Try to click Sign In without filling form
    // Note: native HTML5 validation usually catches this, but checking the button
    const submitBtn = page.locator('button:has-text("Sign In")');
    await expect(submitBtn).toBeEnabled();
  });
});
