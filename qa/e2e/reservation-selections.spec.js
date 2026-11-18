import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let reference = '';
const selectedNames = [];

function futureDate(days) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  );
}

async function simpleMenuItems(request) {
  const qaApiOrigin = `http://localhost:${process.env.QA_API_PORT ?? '5001'}`;
  const response = await request.get(`${qaApiOrigin}/api/v1/menu/items?limit=60&sort=recommended`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const items = body.data.items.filter(
    (item) =>
      item.isOrderable && !item.hasSizeOptions && !item.hasServingOptions && !item.hasAddonGroups,
  );
  expect(items.length).toBeGreaterThanOrEqual(2);
  return items;
}

async function signInAdmin(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('qa-admin@example.com');
  await page.getByLabel('Password').fill('QaAdminPass123');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test('customer changes quantities and submits multiple reservation selections', async ({
  page,
  request,
}) => {
  const items = await simpleMenuItems(request);
  const chosen = [items.find((item) => item.category?.kind !== 'drink') ?? items[0]];
  const drink = items.find(
    (item) => item.category?.kind === 'drink' && item.slug !== chosen[0].slug,
  );
  if (drink) chosen.push(drink);
  else chosen.push(items.find((item) => item.slug !== chosen[0].slug));

  await page.goto('/reservations');
  await expect(page.getByRole('button', { name: /Add sample demo selection/ })).toHaveCount(0);

  await page.getByLabel('Full name').fill('QA Selection Guest');
  await page.getByLabel('Email').fill(`qa-selection-${Date.now()}@example.com`);
  await page.getByLabel('Phone').fill('+250 788 000 777');
  await page.getByLabel('Guests').fill('3');
  await page.getByLabel('Date').fill(futureDate(4));
  await page.getByLabel('Time').fill('19:30');
  await page.getByLabel('Preparation or dietary notes').fill('No sesame, please.');

  const search = page.getByPlaceholder('Search dishes, drinks or categories');
  for (const item of chosen) {
    await search.fill(item.name);
    const card = page.locator('li').filter({ hasText: item.name }).first();
    await card.getByRole('button', { name: 'Add', exact: true }).click();
    selectedNames.push(item.name);
  }

  await expect(page.getByText('Your selection')).toBeVisible();
  await page.getByRole('button', { name: `Increase quantity of ${selectedNames[0]}` }).click();
  await expect(page.getByText('3 items · estimate only')).toBeVisible();
  await page.getByRole('button', { name: `Remove ${selectedNames[0]}` }).click();
  await expect(page.getByText('1 item · estimate only')).toBeVisible();

  await search.fill(selectedNames[0]);
  await page
    .locator('li')
    .filter({ hasText: selectedNames[0] })
    .first()
    .getByRole('button', { name: 'Add', exact: true })
    .click();

  await expect(page.getByText('2 items · estimate only')).toBeVisible();
  await page.getByRole('button', { name: /Send table request/ }).click();

  await expect(page.getByRole('heading', { name: /Thank you, QA/ })).toBeVisible();
  await expect(page.getByText('Awaiting review')).toBeVisible();
  await expect(page.getByText('Preparation notes: No sesame, please.')).toBeVisible();
  await expect(page.getByText(/This is not a food order/)).toBeVisible();
  reference = (
    await page
      .getByText(/RS-\d{6}-\d{3}/)
      .first()
      .innerText()
  ).trim();
});

test('admin reviews the submitted reservation selections', async ({ page }) => {
  test.skip(!reference, 'The reservation test must create a reference first.');

  await signInAdmin(page);
  await page.goto('/admin/reservations');
  await page.getByRole('button', { name: new RegExp(reference) }).click();

  await expect(page.getByRole('heading', { name: reference, exact: true })).toBeVisible();
  await expect(page.getByText('Food & drink pre-selection')).toBeVisible();
  await expect(page.getByText('Awaiting review')).toBeVisible();
  for (const name of selectedNames) {
    await expect(page.getByText(new RegExp(name))).toBeVisible();
  }
  await expect(page.getByText('Preparation notes: No sesame, please.')).toBeVisible();

  await page.getByLabel('Selection review note').fill('Checked with guest');
  await page.getByRole('button', { name: 'Confirm selection' }).click();
  await expect(page.getByText('Selection confirmed', { exact: true })).toBeVisible();
});

test('reservation can still be submitted without food selections', async ({ page }) => {
  await page.goto('/reservations');
  await page.getByLabel('Full name').fill('QA No Selection Guest');
  await page.getByLabel('Email').fill(`qa-no-selection-${Date.now()}@example.com`);
  await page.getByLabel('Phone').fill('+250 788 000 888');
  await page.getByLabel('Date').fill(futureDate(5));
  await page.getByLabel('Time').fill('18:00');
  await page.getByRole('button', { name: /Send table request/ }).click();

  await expect(page.getByRole('heading', { name: /Thank you, QA/ })).toBeVisible();
  await expect(page.getByText('No pre-selection')).toBeVisible();
  await expect(page.getByText('No food or drinks were selected.')).toBeVisible();
});
