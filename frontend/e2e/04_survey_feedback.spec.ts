import { test, expect } from '@playwright/test';

test.describe('Survey & Feedback Journey', () => {
  test('should submit a survey and verify feedback visibility', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('student.0@nus.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // 2. Navigate to Pending Surveys
    await page.getByRole('link', { name: /Pending Surveys/i }).click();
    await page.waitForURL('**/surveys/pending');
    
    // 3. Start a survey
    await expect(page.getByRole('heading', { name: /Your Feedback Tasks/i })).toBeVisible();
    await page.getByRole('button', { name: /Start Survey/i }).first().click();
    await page.waitForURL('**/surveys/fill/**');
    
    // 4. Fill survey
    await page.locator('.ant-radio-input').nth(4).click(); 
    await page.locator('.ant-radio-input').nth(9).click();
    await page.getByPlaceholder(/What can be improved/i).fill('More practical sessions would be great.');
    
    // Submit
    await page.getByRole('button', { name: /Submit Survey/i }).click();
    
    // 5. Verify success
    await expect(page.getByText(/Survey submitted successfully/i)).toBeVisible();
  });
});
