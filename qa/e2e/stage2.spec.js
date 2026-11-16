import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = ['/', '/menu', '/about', '/gallery', '/reservations', '/contact', '/cart'];

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      width,
    };
  });
  expect(overflow.scrollWidth, `horizontal overflow at ${overflow.width}px`).toBeLessThanOrEqual(
    overflow.width + 1,
  );
}

test.describe('public pages', () => {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`renders core routes at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      for (const route of PUBLIC_ROUTES) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('main, section').first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
      }

      expect(pageErrors).toEqual([]);
    });
  }

  test('menu search, dish detail, cart and checkout quote work', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByLabel('Search the menu').fill('french');
    await expect(page.getByRole('link', { name: 'French Fries' }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: 'French Fries' }).first().click();
    await expect(page.getByRole('heading', { name: 'French Fries' })).toBeVisible();
    await page.getByRole('button', { name: /Add to order/ }).click();

    await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
    await page.getByRole('link', { name: 'Review checkout' }).click();

    await expect(page.getByRole('heading', { name: 'Finish your order.' })).toBeVisible();
    await expect(page.getByText('Order summary')).toBeVisible();
    await expect(page.getByText(/Total/).first()).toBeVisible();
  });

  test('reservation request is saved and explicitly not confirmed', async ({ page }) => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
      new Date(),
    );

    await page.goto('/reservations');
    await page.getByLabel('Full name').fill('QA Guest');
    await page.getByLabel('Email').fill(`qa-reservation-${Date.now()}@example.com`);
    await page.getByLabel('Phone').fill('+250 788 000 111');
    await page.getByLabel('Date').fill(today);
    await page.getByLabel('Time').fill('19:00');
    await page.getByRole('button', { name: 'Send table request' }).click();

    await expect(page.getByRole('heading', { name: /Thank you, QA/ })).toBeVisible();
    await expect(page.getByText(/not confirmed/i).first()).toBeVisible();
    await expect(page.getByText(/^RS-/)).toBeVisible();
  });

  test('contact message is saved without claiming email delivery', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Your name').fill('QA Contact');
    await page.getByLabel('Email').fill(`qa-contact-${Date.now()}@example.com`);
    await page.getByLabel('Message').fill('This is a QA message with enough detail to submit.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('heading', { name: 'Message received.' })).toBeVisible();
    await expect(page.getByText(/Email delivery is not connected/i)).toBeVisible();
  });

  test('register, account and sign out work', async ({ page }) => {
    const email = `qa-account-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel('Full name').fill('QA Account');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Phone').fill('+250 788 000 222');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('QaPassword123');
    await passwordInputs.nth(1).fill('QaPassword123');
    await page.getByRole('button', { name: /Create account/ }).click();

    await expect(page.getByRole('heading', { name: /Hello, QA/ })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  });
});
