import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.getByRole('heading', { name: /Focus Together, Achieve More/i })).toBeVisible();

    // Check navigation
    await expect(page.getByRole('link', { name: /ADHDBuddy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign Up/i })).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Get Started Free/i }).click();

    await expect(page).toHaveURL('/signup');
    await expect(page.getByRole('heading', { name: /Create Your Account/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Login/i }).first().click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });
});
