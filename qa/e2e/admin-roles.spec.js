import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function signIn(page, email, password) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test('admin sees capability-based modules and staff cannot reach privileged pages', async ({
  page,
}) => {
  const staffEmail = `qa-staff-${Date.now()}@example.com`;

  await signIn(page, 'qa-admin@example.com', 'QaAdminPass123');
  await expect(page.getByRole('heading', { name: "Today's numbers" })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Customers', exact: true })).toHaveCount(0);
  await expect(page.getByText('Customers', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email outbox', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Audit log', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Staff', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Staff', exact: true, level: 2 })).toBeVisible();
  await page.getByLabel('Name').fill('QA Restricted Staff');
  await page.getByLabel('Email').fill(staffEmail);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Staff account created')).toBeVisible();

  const temporaryPassword = (await page.locator('code').last().textContent())?.trim() ?? '';
  expect(temporaryPassword.length).toBeGreaterThan(12);

  await page.getByRole('button', { name: /log out/i }).click();
  await expect(page.getByText('Signed out')).toBeVisible();
  await signIn(page, staffEmail, temporaryPassword);

  await expect(page.getByRole('link', { name: 'Orders', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reservations', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Audit log', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Menu review', exact: true })).toHaveCount(0);

  await page.goto('/admin/staff');
  await expect(page).toHaveURL(/\/403$/);
  await expect(page.getByRole('heading', { name: 'This area is for staff.' })).toBeVisible();
});

test('admin can open menu catalogue, email and audit modules', async ({ page }) => {
  await signIn(page, 'qa-admin@example.com', 'QaAdminPass123');

  await page.getByRole('link', { name: 'Menu review', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menu catalogue' })).toBeVisible();
  await expect(page.getByText('Create menu item')).toBeVisible();
  await expect(page.getByText('Create or edit category')).toBeVisible();

  await expect(page.getByRole('link', { name: 'Customers', exact: true })).toHaveCount(0);
  await page.goto('/admin/customers');
  await expect(page.getByRole('heading', { name: 'Nothing on this plate.' })).toBeVisible();

  await page.getByRole('link', { name: 'Email outbox', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Email outbox', level: 2 })).toBeVisible();

  await page.getByRole('link', { name: 'Audit log', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Audit log', level: 2 })).toBeVisible();
});
