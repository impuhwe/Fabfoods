import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import MenuItem from '../src/models/MenuItem.js';
import MenuReviewIssue from '../src/models/MenuReviewIssue.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { seedMenu } from '../scripts/seedMenu.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import {
  getWithAuth,
  loginUser,
  patchWithCsrf,
  postWithCsrf,
  registerUser,
} from './helpers/auth.js';

const ADMIN = {
  name: 'Menu Review Admin',
  email: 'menu-review-admin@example.com',
  password: 'MenuReviewPass123',
};

describe('menu review workflow', () => {
  let adminTokens;
  let customerTokens;

  beforeAll(async () => {
    await startTestDatabase();
    await seedMenu({ allowUnverified: true });
    await createAdmin(ADMIN);
    ({ tokens: adminTokens } = await loginUser(ADMIN.email, ADMIN.password));
    ({ tokens: customerTokens } = await registerUser());
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('keeps every seeded item off public endpoints and out of order quotes', async () => {
    const items = await getWithAuth('/menu/items', {}).expect(200);
    expect(items.body.data.items).toHaveLength(0);
    expect(items.body.meta.total).toBe(0);

    const meta = await getWithAuth('/menu/meta', {}).expect(200);
    expect(meta.body.data.totalItems).toBe(0);

    await getWithAuth('/menu/items/whole-grilled-chicken', {}).expect(404);

    const quote = await postWithCsrf(
      '/orders/quote',
      { items: [{ slug: 'french-fries', quantity: 1 }] },
      customerTokens,
    ).expect(409);
    expect(quote.body.error.code).toBe('ITEM_NOT_VERIFIED');
  });

  it('restricts menu review endpoints to manager and admin staff', async () => {
    await getWithAuth('/admin/menu/items', customerTokens).expect(403);
    await getWithAuth('/admin/menu/review-issues', adminTokens).expect(200);
  });

  it('lists seeded review issues and affected menu items for admins', async () => {
    const items = await getWithAuth('/admin/menu/items?limit=100', adminTokens).expect(200);
    expect(items.body.meta.total).toBe(111);
    expect(items.body.data[0]).toMatchObject({
      verified: false,
      needsReview: true,
      dataSource: 'pdf',
    });

    const issues = await getWithAuth('/admin/menu/review-issues', adminTokens).expect(200);
    expect(issues.body.data.issues).toHaveLength(24);
    expect(issues.body.data.issues).toContainEqual(
      expect.objectContaining({
        issueId: 'breakfast-price-layout',
        status: 'open',
        blocking: true,
      }),
    );
  });

  it('lets an admin edit, verify and archive a seeded menu item', async () => {
    const list = await getWithAuth('/admin/menu/items?search=crispy', adminTokens).expect(200);
    const item = list.body.data.find((entry) => entry.slug === 'crispy-firsh-finger');
    expect(item).toBeTruthy();

    const updated = await patchWithCsrf(
      `/admin/menu/items/${item.id}`,
      {
        name: 'Crispy Fish Finger (reviewed)',
        description: 'Name corrected after staff review.',
        note: 'Corrected source spelling',
      },
      adminTokens,
    ).expect(200);
    expect(updated.body.data.item.name).toBe('Crispy Fish Finger (reviewed)');

    const verified = await postWithCsrf(
      `/admin/menu/items/${item.id}/verify`,
      { note: 'Name and price checked' },
      adminTokens,
    ).expect(200);
    expect(verified.body.data.item).toMatchObject({
      verified: true,
      needsReview: false,
      reviewStatus: 'verified',
      isAvailable: true,
    });

    const archived = await postWithCsrf(
      `/admin/menu/items/${item.id}/archive`,
      {},
      adminTokens,
    ).expect(200);
    expect(archived.body.data.item).toMatchObject({ isArchived: true, isAvailable: false });
  });

  it('rejects order quotes for archived items as not found', async () => {
    const item = await MenuItem.findOne({ slug: 'crispy-firsh-finger' });
    item.isArchived = true;
    item.verified = true;
    item.needsReview = false;
    item.isAvailable = false;
    await item.save();

    const quote = await postWithCsrf(
      '/orders/quote',
      { items: [{ slug: 'crispy-firsh-finger', quantity: 1 }] },
      customerTokens,
    ).expect(404);
    expect(quote.body.error.code).toBe('NOT_FOUND');
  });

  it('resolves a review issue, records the audit history and unblocks affected items', async () => {
    const issue = await MenuReviewIssue.findOne({ issueId: 'crispy-firsh' });
    expect(issue).toBeTruthy();

    const response = await postWithCsrf(
      `/admin/menu/review-issues/${issue.id}/resolve`,
      { status: 'resolved', resolution: 'Renamed to Crispy Fish Finger after PDF check' },
      adminTokens,
    ).expect(200);
    expect(response.body.data.issue).toMatchObject({
      issueId: 'crispy-firsh',
      status: 'resolved',
      resolution: 'Renamed to Crispy Fish Finger after PDF check',
    });
    expect(response.body.data.issue.history.at(-1).action).toBe('resolved');

    const item = await MenuItem.findOne({ slug: 'crispy-firsh-finger' });
    expect(item.hasUnresolvedBlockingIssues).toBe(false);
    expect(item.reviewIssueIds.map(String)).not.toContain(String(issue._id));
  });

  it('requires a resolution note for a resolved issue', async () => {
    const issue = await MenuReviewIssue.findOne({ issueId: 'masedoine' });
    const response = await postWithCsrf(
      `/admin/menu/review-issues/${issue.id}/resolve`,
      { status: 'resolved', resolution: '' },
      adminTokens,
    ).expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
