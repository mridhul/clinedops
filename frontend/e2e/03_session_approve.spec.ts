import { test, expect } from '@playwright/test';

test.describe('Teaching Session Journey', () => {
  test('should log a new session as tutor and then approve as admin', async ({ page }) => {
    // 1. Login as Tutor
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('tutor.medicine.0@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // 2. Click Log Teaching Hours button in Sidebar
    await page.getByRole('button', { name: /Log Teaching Hours/i }).click();
    await page.waitForURL('**/teaching-sessions/new');
    
    // 3. Fill Session Form
    await page.getByLabel('Posting').fill('88888888-8888-8888-8888-888888888888');
    await page.getByLabel('Session Type').click();
    await page.getByText('Scheduled', { exact: true }).click();
    await page.getByLabel('Duration (minutes)').fill('150');
    await page.getByLabel('Description').fill('Taught students about pulmonary edema.');
    
    // Date/Time
    await page.getByLabel('Session Date & Time').click();
    await page.keyboard.press('Enter');
    
    // Submit
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await page.waitForURL('**/teaching-sessions');
    
    // 4. Submit the draft
    await page.getByRole('button', { name: 'Submit' }).first().click();
    
    // 5. Logout
    await page.locator('.ant-avatar').click();
    await page.getByText('Sign Out').click();
    await page.waitForURL('**/login');
    
    // 6. Login as Admin
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('superadmin@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // 7. Navigate to Sessions
    await page.getByRole('link', { name: /Teaching History/i }).click();
    await page.waitForURL('**/teaching-sessions');
    
    // 8. Find pending session and approve
    await expect(page.getByRole('heading', { name: /Teaching Sessions/i })).toBeVisible();
    await page.getByRole('tab', { name: /Pending Review/i }).click();
    await page.getByRole('button', { name: /Approve/i }).first().click();
    
    // Verify status tag
    await expect(page.getByText('APPROVED').first()).toBeVisible();
  });
});
