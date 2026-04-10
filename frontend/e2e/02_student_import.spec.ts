import { test, expect } from '@playwright/test';

test.describe('Student Management & Import Journey', () => {
  test('should create a new student manually', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('superadmin@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // 2. Navigate to User Management
    await page.getByRole('link', { name: /User Management/i }).click();
    await page.waitForURL('**/students');
    
    // Title is "Students" in StudentsListPage.tsx
    await expect(page.getByRole('heading', { name: /Students/i })).toBeVisible();
    
    // 3. Open Create Drawer (Actually a link to /new)
    await page.getByRole('link', { name: /Add Student/i }).click();
    await page.waitForURL('**/students/new');
    
    // 4. Fill form (StudentFormPage.tsx)
    const studentEmail = `manual.student.${Date.now()}@nus.edu.sg`;
    await page.getByLabel('Email', { exact: true }).fill(studentEmail);
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByLabel('Student code').fill('S' + Date.now().toString().slice(-6));
    await page.getByLabel('Full name').fill('Manual Test Student');
    
    // Select Discipline
    await page.getByLabel('Discipline').click();
    await page.getByText('Medicine', { exact: true }).click();
    
    // Submit
    await page.getByRole('button', { name: 'Save' }).click();
    
    // 5. Verify in list
    await page.waitForURL('**/students');
    await expect(page.getByText(studentEmail)).toBeVisible();
  });

  test('should navigate to import history', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Professional Email').fill('superadmin@nuhs.edu.sg');
    await page.getByLabel('Password').fill('ClinEdOps2024!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
    
    // Navigate to Admin Console -> Import History
    await page.getByRole('link', { name: /Admin Console/i }).click();
    await page.waitForURL('**/admin');
    
    // Tab label is "Import History" in AdminOverview.tsx
    await page.getByText('Import History').click();
    
    await expect(page.getByText('Batch Ingest History')).toBeVisible();
  });
});
