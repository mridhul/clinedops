import { test, expect } from '@playwright/test';

test.describe('Login & Dashboard Journey', () => {
  test('should login as admin and see dashboard stats', async ({ page }) => {
    // 1. Visit login
    await page.goto('/login');
    
    // 2. Fill credentials
    await page.getByLabel('Professional Email').fill('superadmin@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    
    // 3. Submit
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // 4. Verify redirection
    await page.waitForURL('**/dashboard');
    
    // 5. Verify dashboard content
    await expect(page.getByRole('heading', { name: /Admin Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Active Students/i)).toBeVisible();
    
    // 6. Verify sidebar links (use more general locators)
    await expect(page.getByText(/User Management/i)).toBeVisible();
    await expect(page.getByText(/Admin Console/i)).toBeVisible();
  });

  test('should login as student and see student dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('student.0@nus.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await page.waitForURL('**/dashboard');
    
    // 5. Verify dashboard content
    await expect(page.getByRole('heading', { name: /Student Dashboard/i })).toBeVisible();
    
    // 6. Verify sidebar links
    await expect(page.getByText(/My Sessions/i)).toBeVisible();
    await expect(page.getByText(/Pending Surveys/i)).toBeVisible();
  });
});
