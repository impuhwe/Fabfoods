import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const dateInKigali = (offsetDays = 5) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  );

const displayDate = (isoDate) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`));

async function openCalendar(page, label) {
  if ((await page.locator('.rdp-root').count()) === 0) {
    await page.getByLabel(label).click();
  }
  await expect(page.locator('.rdp-root')).toBeVisible();
}

async function pickCalendarDate(page, label, isoDate) {
  await openCalendar(page, label);

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const dayButton = page.locator(`[data-day="${isoDate}"] button`);
    if ((await dayButton.count()) > 0) {
      await dayButton.click();
      return;
    }
    await page.locator('.rdp-button_next').click();
  }

  throw new Error(`Could not find ${isoDate} in the calendar`);
}

async function signInAdmin(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('qa-admin@example.com');
  await page.getByLabel('Password').fill('QaAdminPass123');
  await page.getByRole('button', { name: /Sign in/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function capturedInviteUrl(email) {
  const capturesFile = path.resolve('test-results/qa-email-captures.json');
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      const captures = JSON.parse(await readFile(capturesFile, 'utf8'));
      const capture = [...captures]
        .reverse()
        .find(
          (entry) =>
            entry.to === email && entry.text.includes('/admin/accept-invitation#invitation='),
        );
      const match = capture?.text.match(/https?:\/\/\S+/);
      if (match) return match[0].replace(/[.)]+$/, '');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`No captured invitation email for ${email}`);
}

async function expectWhiteOrderingCta(locator) {
  await expect(locator).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(locator).toHaveCSS('background-color', 'rgb(217, 119, 66)');
}

async function expectWhiteLinkCta(page, path, label) {
  await page.goto(path);
  const link = page.getByRole('link', { name: label, exact: true });
  await expect(link).toBeVisible();

  await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(link).toHaveCSS('background-color', 'rgb(217, 119, 66)');

  await link.hover();
  await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(link).toHaveCSS('background-color', 'rgb(231, 150, 96)');

  await link.focus();
  await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');

  const box = await link.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(link).toHaveCSS('background-color', 'rgb(188, 95, 47)');
  await page.mouse.up();
}

async function expectWhiteFormSubmitCta(page, path, label) {
  await page.goto(path);
  const button = page.getByRole('button', { name: label, exact: true });
  await expect(button).toBeVisible();

  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(button).toHaveCSS('background-color', 'rgb(217, 119, 66)');

  await button.hover();
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(button).toHaveCSS('background-color', 'rgb(231, 150, 96)');

  await button.focus();
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');

  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(button).toHaveCSS('background-color', 'rgb(188, 95, 47)');
  await page.mouse.up();

  await button.evaluate((element) => {
    element.disabled = true;
  });
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(button).toHaveCSS('background-color', 'rgb(217, 119, 66)');
  await expect(button).toHaveCSS('opacity', '0.5');
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

    const eventDate = dateInKigali(7);
    await page.getByLabel('Your name').fill('QA Catering Guest');
    await page.getByLabel('Email').fill(`qa-catering-${Date.now()}@example.com`);
    await page.getByLabel('Phone').fill('+250 788 000 555');
    await page.getByLabel('Event type').click();
    await page.getByRole('option', { name: 'Corporate event' }).click();
    await pickCalendarDate(page, 'Event date', eventDate);
    await page.getByLabel('Expected guests').fill('35');
    await page.getByLabel('Location').fill('Kigali');
    await page.getByLabel('What do you need?').fill('We need a lunch spread for a team workshop.');

    const requestPromise = page.waitForRequest('**/api/v1/catering');
    await page.getByRole('button', { name: 'Send catering request' }).click();
    const request = await requestPromise;
    expect(request.postDataJSON()).toMatchObject({
      eventType: 'corporate',
      eventDate,
      guestCount: 35,
    });

    await expect(page.getByRole('heading', { name: 'Catering request received.' })).toBeVisible();
    await expect(page.getByText('No account was created.')).toBeVisible();
  });

  test('reservation date picker disables past dates, navigates months and validates a cleared date', async ({
    page,
  }) => {
    await page.goto('/reservations');

    await page.getByLabel('Date').click();
    await expect(page.locator('.rdp-root')).toBeVisible();

    const yesterday = dateInKigali(-1);
    if ((await page.locator(`[data-day="${yesterday}"]`).count()) > 0) {
      await expect(page.locator(`[data-day="${yesterday}"]`)).toHaveAttribute(
        'data-disabled',
        'true',
      );
    }

    const captionBefore = await page.locator('.rdp-caption_label').textContent();
    await page.locator('.rdp-button_next').click();
    await expect(page.locator('.rdp-caption_label')).not.toHaveText(captionBefore);

    const targetDate = dateInKigali(35);
    await pickCalendarDate(page, 'Date', targetDate);
    await expect(page.locator('.rdp-root')).toHaveCount(0);
    await expect(page.getByLabel('Date')).toContainText(displayDate(targetDate));

    await page.getByLabel('Date').click();
    await page.getByRole('button', { name: 'Clear date' }).click();
    await expect(page.getByLabel('Date')).toContainText('Pick a date');

    await page.getByLabel('Full name').fill('QA Date Guest');
    await page.getByLabel('Email').fill(`qa-date-${Date.now()}@example.com`);
    await page.getByLabel('Phone').fill('+250 788 000 777');
    await page.getByLabel('Time').selectOption('19:00');
    await page.getByRole('button', { name: 'Send table request' }).click();

    await expect(page.getByText('Choose a valid date')).toBeVisible();
  });

  test('catering event type supports pointer and keyboard selection', async ({ page }) => {
    await page.goto('/catering');

    const eventType = page.getByLabel('Event type');
    await expect(eventType).toContainText('Select event type');
    await eventType.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option')).toHaveText([
      'Corporate event',
      'Private celebration',
      'Wedding',
      'Community gathering',
      'Other',
    ]);
    await expect(page.getByRole('option', { name: 'Corporate event' })).toBeVisible();
    await expect(page.locator('[data-radix-select-viewport]')).toHaveCSS('overflow-y', 'auto');

    const triggerBox = await eventType.boundingBox();
    const desktopListBox = await page.getByRole('listbox').boundingBox();
    expect(Math.abs((desktopListBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(2);
    expect(Math.abs((desktopListBox?.width ?? 0) - (triggerBox?.width ?? 0))).toBeLessThan(2);
    await page.keyboard.press('Escape');

    await eventType.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(eventType).toContainText('Corporate event');

    await pickCalendarDate(page, 'Event date', dateInKigali(7));
    await expect(page.getByLabel('Event date')).toContainText(displayDate(dateInKigali(7)));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Event date').click();
    const calendarBox = await page.locator('.rdp-root').boundingBox();
    expect(calendarBox?.x).toBeGreaterThanOrEqual(0);
    expect((calendarBox?.x ?? 0) + (calendarBox?.width ?? 0)).toBeLessThanOrEqual(390);
    await page.keyboard.press('Escape');

    await eventType.click();
    const listBox = await page.getByRole('listbox').boundingBox();
    expect(listBox?.x).toBeGreaterThanOrEqual(0);
    expect((listBox?.x ?? 0) + (listBox?.width ?? 0)).toBeLessThanOrEqual(390);
  });

  test('reservation occasion is optional with no default selection', async ({ page }) => {
    await page.goto('/reservations');

    const occasion = page.getByRole('radiogroup', { name: 'Occasion' });
    await expect(occasion).toBeVisible();
    await expect(page.getByText(/Optional — leave unselected/)).toBeVisible();
    await expect(page.getByText('No special occasion')).toHaveCount(0);
    await expect(occasion.locator('input:checked')).toHaveCount(0);
    await expect(page.getByText('Food & drink pre-selection')).toHaveCount(0);
    await expect(page.getByLabel('Preparation or dietary notes')).toHaveCount(0);
    await expect(page.getByPlaceholder('Search dishes, drinks or categories')).toHaveCount(0);
    await expect(page.getByText('No food or drinks selected.')).toHaveCount(0);
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

  test('desktop ordering CTAs use white text on unchanged ember backgrounds', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/');
    await expectWhiteOrderingCta(page.getByRole('link', { name: /Order now/ }).first());

    await page.goto('/menu');
    await page.getByLabel('Search the menu').fill('french');
    await expectWhiteOrderingCta(page.getByRole('button', { name: 'Add', exact: true }).first());

    await page.getByRole('link', { name: 'French Fries' }).first().click();
    await expectWhiteOrderingCta(page.getByRole('button', { name: /Add to order/ }));
    await page.getByRole('button', { name: /Add to order/ }).click();
    await expectWhiteOrderingCta(page.getByRole('link', { name: 'Review checkout' }));

    await page.getByRole('link', { name: 'Review checkout' }).click();
    await expectWhiteOrderingCta(
      page.getByRole('button', { name: /Place order|Continue to payment/ }),
    );
  });

  test('mobile ordering CTA uses white text on unchanged ember background', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();

    await expectWhiteOrderingCta(page.getByRole('link', { name: 'Order now' }).last());
  });

  for (const { path, label } of [
    { path: '/reservations', label: 'Send table request' },
    { path: '/catering', label: 'Send catering request' },
    { path: '/contact', label: 'Send message' },
    { path: '/login', label: 'Sign in' },
    { path: '/register', label: 'Create account' },
  ]) {
    test(`${label} keeps white text across default, hover, focus, active and disabled states`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expectWhiteFormSubmitCta(page, path, label);
    });
  }

  for (const { path, label } of [
    { path: '/about', label: 'See the menu' },
    { path: '/gallery', label: 'Request a table' },
  ]) {
    test(`${label} keeps white text across default, hover, focus and active states`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expectWhiteLinkCta(page, path, label);
    });
  }
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
    const inviteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/admin/invitations') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Send invitation' }).click();
    const inviteResponse = await inviteResponsePromise;
    const inviteBody = await inviteResponse.json();

    const inviteUrl = await capturedInviteUrl(email);
    const token = new URLSearchParams(new URL(inviteUrl).hash.slice(1)).get('invitation');
    expect(inviteUrl).toMatch(/\/admin\/accept-invitation#invitation=/);
    expect(inviteBody.data.inviteUrl).toBeUndefined();
    expect(inviteBody.data.emailSent).toBe(true);
    expect(JSON.stringify(inviteBody)).not.toContain(token);
    expect(await page.getByText(/Share this one-time link securely:/).count()).toBe(0);
    await expect(page.getByText(/The invitation was emailed/)).toBeVisible();

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
