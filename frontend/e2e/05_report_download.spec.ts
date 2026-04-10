import { test, expect } from '@playwright/test';

test.describe('Reporting Journey', () => {
  test('should generate a report and download it', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('superadmin@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // 2. Navigate to Reports
    await page.getByRole('link', { name: /Reports/i }).click();
    await page.waitForURL('**/reports');
    
    // 3. Configure Report
    await page.getByText(/Select a report template/i).click();
    await page.locator('.ant-select-item-option').first().click();
    
    // 4. Click Generate
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Generate Report/i }).click();
    const download = await downloadPromise;
    
    // 5. Verify download
    expect(download.suggestedFilename()).toContain('report');
  });
});
