import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show signup form with all required fields', async ({ page }) => {
    await page.goto('/signup');

    // Check form elements
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/Confirm Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Up/i })).toBeVisible();

    // Check link to login
    await expect(page.getByRole('link', { name: /Sign in/i })).toBeVisible();
  });

  test('should show login form with all required fields', async ({ page }) => {
    await page.goto('/login');

    // Check form elements
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // Check link to signup
    await expect(page.getByRole('link', { name: /Sign up/i })).toBeVisible();
  });

  test('should show error for invalid signup', async ({ page }) => {
    await page.goto('/signup');

    // Try to submit with mismatched passwords
    await page.getByLabel(/Email/i).fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel(/Confirm Password/i).fill('differentpassword');
    await page.getByRole('button', { name: /Sign Up/i }).click();

    // Should show error
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  });

  test('should show error for short password', async ({ page }) => {
    await page.goto('/signup');

    // Try to submit with short password
    await page.getByLabel(/Email/i).fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('123');
    await page.getByLabel(/Confirm Password/i).fill('123');
    await page.getByRole('button', { name: /Sign Up/i }).click();

    // Should show error
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from history', async ({ page }) => {
    await page.goto('/history');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from profile', async ({ page }) => {
    await page.goto('/profile');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});
