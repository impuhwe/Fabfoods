import { expect, test } from '@playwright/test';

const dateInKigali = (offsetDays = 5) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );

async function signInAdmin(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('qa-admin@example.com');
  await page.getByLabel('Password').fill('QaAdminPass123');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe('Phase 1 guest and typography requirements', () => {
  test('uses the verified editorial and interface fonts in the browser', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const price = page.locator('main .font-price').first();
    await expect(price).toBeVisible({ timeout: 15_000 });

    const fonts = await page.evaluate(() => ({
      heading: getComputedStyle(document.querySelector('main h1')).fontFamily,
      price: getComputedStyle(document.querySelector('main .font-price')).fontFamily,
    }));

    expect(fonts.heading).toContain('Cardo');
    expect(fonts.price).toContain('Inter');
  });

  test('renders the public menu as text with category headings and no product images', async ({
    page,
  }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main section h2').first()).toBeVisible();
    await expect(page.locator('main img').first()).toHaveCount(0);
    await page.getByLabel('Search the menu').fill('french');
    await expect(page.getByRole('link', { name: 'French Fries' }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('submits a catering request without an account', async ({ page }) => {
    await page.goto('/catering');
    await expect(page.getByRole('heading', { name: 'Feed the whole room.' })).toBeVisible();

    await page.getByLabel('Your name').fill('QA Catering Guest');
    await page.getByLabel('Email').fill(`qa-catering-${Date.now()}@example.com`);
    await page.getByLabel('Phone').fill('+250 788 000 555');
    await page.getByLabel('Event type').selectOption('corporate');
    await page.getByLabel('Event date').fill(dateInKigali());
    await page.getByLabel('Expected guests').fill('35');
    await page.getByLabel('Location').fill('Kigali');
    await page.getByLabel('What do you need?').fill('We need a lunch spread for a team workshop.');
    await page.getByRole('button', { name: 'Send catering request' }).click();

    await expect(page.getByRole('heading', { name: 'Catering request received.' })).toBeVisible();
    await expect(page.getByText('No account was created.')).toBeVisible();
  });

  test('reservation occasion is optional with no default selection', async ({ page }) => {
    await page.goto('/reservations');

    const occasion = page.getByRole('radiogroup', { name: 'Occasion' });
    await expect(occasion).toBeVisible();
    await expect(page.getByText(/Optional — leave unselected/)).toBeVisible();
    await expect(page.getByText('No special occasion')).toHaveCount(0);
    await expect(occasion.locator('input:checked')).toHaveCount(0);
  });

  test('checkout uses one delivery address line and no removed location fields', async ({
    page,
  }) => {
    await page.goto('/menu');
    await page.getByLabel('Search the menu').fill('french');
    await page.getByRole('link', { name: 'French Fries' }).first().click();
    await page.getByRole('button', { name: /Add to order/ }).click();
    await page.getByRole('link', { name: 'Review checkout' }).click();

    await expect(page.getByRole('heading', { name: 'Finish your order.' })).toBeVisible();
    await page.getByRole('radio', { name: /Delivery/ }).check();

    await expect(page.getByLabel('Delivery address')).toBeVisible();
    await expect(page.getByLabel('Delivery notes')).toBeVisible();
    for (const removedLabel of ['Sector', 'District', 'City', 'Apartment']) {
      await expect(page.getByLabel(removedLabel, { exact: true })).toHaveCount(0);
    }
  });
});

test.describe('Phase 1 administrator invitations', () => {
  test('admin invites a new administrator who sets their own password', async ({ page }) => {
    const email = `qa-invited-admin-${Date.now()}@example.com`;

    await signInAdmin(page);
    await page.goto('/admin/invitations');
    await expect(
      page.getByRole('heading', { name: 'Administrator invitations', level: 2 }),
    ).toBeVisible();

    await page.getByLabel('Name', { exact: true }).fill('QA Invited Admin');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Send invitation' }).click();

    const linkText = await page.getByText(/Share this one-time link securely:/).textContent();
    const inviteUrl = linkText?.match(/https?:\/\/[^\s]+/)?.[0];
    expect(inviteUrl).toMatch(/\/admin\/accept-invitation#invitation=/);

    const invitePage = await page.context().newPage();
    await invitePage.goto(inviteUrl);
    await expect(invitePage.getByRole('heading', { name: 'Set your password' })).toBeVisible();
    await invitePage.getByLabel('New password').fill('InvitedAdmin123');
    await invitePage.getByLabel('Confirm password').fill('InvitedAdmin123');
    await invitePage.getByRole('button', { name: 'Set password and accept' }).click();

    await expect(
      invitePage.getByRole('heading', { name: 'Administrator access is ready.' }),
    ).toBeVisible();

    await invitePage.context().clearCookies();
    await invitePage.goto('/admin/login');
    await invitePage.getByLabel('Email').fill(email);
    await invitePage.getByLabel('Password').fill('InvitedAdmin123');
    await invitePage.getByRole('button', { name: /Sign in/ }).click();
    await expect(invitePage).toHaveURL(/\/admin$/);
    await expect(invitePage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await invitePage.close();
  });
});
