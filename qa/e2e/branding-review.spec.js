import { test, expect } from '@playwright/test';

test.describe('FAB FOODS branding and menu review', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/https:\/\/images\.unsplash\.com\//, (route) => route.abort());
  });

  test('uses the official logo and confirmed content on the homepage', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/');

    await expect(page.getByRole('img', { name: 'FAB FOODS' }).first()).toBeVisible();
    await expect(
      page.locator('img[src="/brand/fab-foods-logo.webp"]').first(),
    ).toHaveAttribute('src', '/brand/fab-foods-logo.webp');
    await expect(page.getByRole('link', { name: 'Order now' }).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Feed your brain/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kitchen, coffee and a table.' }),
    ).toBeVisible();
    await expect(
      page.getByText(/Opening hours, address, phone and social accounts are not published/i),
    ).toBeVisible();
    await expect(
      page.getByRole('contentinfo').getByText(/representative stock photography/i),
    ).toBeVisible();
    expect(consoleErrors.filter((message) => /fetchPriority/i.test(message))).toEqual([]);
  });

  test('lets an admin review and publish a seeded menu item', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('qa-admin@example.com');
    await page.getByLabel('Password').fill('QaAdminPass123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/menu-review');

    await expect(page.getByRole('heading', { name: 'Menu review', level: 1 })).toBeVisible();
    await expect(page.getByText(/24 unresolved issues/)).toBeVisible();

    await page.getByRole('button', { name: /Continental Breakfast/i }).first().click();
    await expect(page.getByRole('heading', { name: /CONTINENTAL BREAKFAST/i })).toBeVisible();

    await page.getByRole('button', { name: 'Verify & publish' }).click();
    await expect(page.getByRole('dialog')).toContainText('Verify and publish');
    await page.getByRole('dialog').getByRole('button', { name: 'Verify & publish' }).click();

    await expect(page.getByText(/is verified and published/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /CONTINENTAL BREAKFAST.*Verified/i }),
    ).toBeVisible();
  });
});
