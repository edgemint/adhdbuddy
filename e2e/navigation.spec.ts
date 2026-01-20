import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working logo link', async ({ page }) => {
    await page.goto('/login');

    // Click logo to go home
    await page.getByRole('link', { name: /ADHDBuddy/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('should navigate between login and signup', async ({ page }) => {
    // Start at login
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();

    // Go to signup
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL('/signup');
    await expect(page.getByRole('heading', { name: /Create Your Account/i })).toBeVisible();

    // Go back to login
    await page.getByRole('link', { name: /Sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should show login and signup links when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign Up/i })).toBeVisible();
  });

  test('home page features should be visible', async ({ page }) => {
    await page.goto('/');

    // Check feature cards are visible
    await expect(page.getByText(/Set Goals/i)).toBeVisible();
    await expect(page.getByText(/Smart Matching/i)).toBeVisible();
    await expect(page.getByText(/Video Accountability/i)).toBeVisible();
  });
});
