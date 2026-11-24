import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let orderNumber = '';

async function registerCustomer(page) {
  const email = `qa-stage3-${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Full name').fill('QA Stage Three');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Phone').fill('+250 788 000 333');
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('QaPassword123');
  await passwordInputs.nth(1).fill('QaPassword123');
  await page.getByRole('button', { name: /Create account/ }).click();
  await expect(page.getByRole('heading', { name: /Hello, QA/ })).toBeVisible();
  return email;
}

async function signInAdmin(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('qa-admin@example.com');
  await page.getByLabel('Password').fill('QaAdminPass123');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test('signed-in customer places an offline order and sees it in account history', async ({
  page,
}) => {
  await registerCustomer(page);

  await page.goto('/menu');
  await page.getByLabel('Search the menu').fill('french');
  await page.getByRole('link', { name: 'French Fries' }).first().click();
  await expect(page.getByRole('heading', { name: 'FRENCH FRIES', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Add to order/ }).click();
  await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
  await page.getByRole('link', { name: 'Review checkout' }).click();

  await expect(page.getByRole('heading', { name: 'Finish your order.' })).toBeVisible();
  await expect(page.getByText('Pay at the restaurant').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place order' })).toBeEnabled({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/order\/FF-/, { timeout: 20_000 });
  orderNumber = page.url().split('/order/')[1];
  await expect(page.getByText(orderNumber)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confirmed' })).toBeVisible();
  await expect(page.getByText('Payment pending')).toBeVisible();

  await page.goto('/account');
  await expect(page.getByRole('heading', { name: /Hello, QA/ })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(orderNumber) })).toBeVisible();
});

test('admin updates the order status', async ({ page }) => {
  test.skip(!orderNumber, 'The checkout test must create an order first.');

  await signInAdmin(page);
  await page.getByRole('link', { name: 'Orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Orders', level: 2 })).toBeVisible();

  await page.getByRole('button', { name: new RegExp(orderNumber) }).click();
  await expect(page.getByRole('heading', { name: orderNumber })).toBeVisible();
  await page.getByRole('button', { name: 'Mark preparing' }).click();

  await expect(page.locator('aside').getByText('Preparing', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark ready' })).toBeVisible();
});

test('admin approves a pending reservation', async ({ page }) => {
  const guestEmail = `qa-stage3-res-${Date.now()}@example.com`;

  await page.goto('/reservations');
  await page.getByLabel('Full name').fill('QA Stage Three Guest');
  await page.getByLabel('Email').fill(guestEmail);
  await page.getByLabel('Phone').fill('+250 788 000 444');
  await page.getByLabel('Time').selectOption('19:30');
  await page.getByRole('button', { name: 'Send table request' }).click();

  await expect(page.getByRole('heading', { name: /Thank you, QA/ })).toBeVisible();
  const reference = await page.getByText(/^RS-/).textContent();
  expect(reference).toMatch(/^RS-/);

  await signInAdmin(page);
  await page.getByRole('link', { name: 'Reservations', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reservations', level: 2 })).toBeVisible();

  await page.getByRole('button', { name: new RegExp(reference) }).click();
  await page.getByRole('button', { name: 'Approve' }).click();

  await expect(page.locator('aside').getByText('Confirmed', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark completed' })).toBeVisible();
});

test('settings page exposes guarded business configuration', async ({ page }) => {
  await signInAdmin(page);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Business settings', level: 2 })).toBeVisible();
  await expect(
    page.getByText('Only approved information is shown on the public site.'),
  ).toBeVisible();
  await expect(
    page.getByText('Requests always stay pending until staff approve them.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save settings' }).first()).toBeVisible();
});
