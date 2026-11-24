import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import AuditLog from '../src/models/AuditLog.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';
import { PERMISSIONS, ROLE_PERMISSIONS, permissionsForRole } from '../src/config/permissions.js';
import { updateStaff } from '../src/services/adminUser.service.js';
import { getSettings } from '../src/services/settings.service.js';
import { createAdmin } from '../scripts/createAdmin.js';
import { startTestDatabase, stopTestDatabase } from './helpers/db.js';
import { getWithAuth, loginUser, patchWithCsrf, postWithCsrf } from './helpers/auth.js';

const PASSWORD = 'RoleMatrixPass123';

const ACCOUNTS = {
  admin: { name: 'Matrix Admin', email: 'matrix-admin@example.com', role: ROLES.ADMIN },
  manager: { name: 'Matrix Manager', email: 'matrix-manager@example.com', role: ROLES.MANAGER },
  staff: { name: 'Matrix Staff', email: 'matrix-staff@example.com', role: ROLES.STAFF },
  customer: { name: 'Matrix Customer', email: 'matrix-customer@example.com', role: ROLES.CUSTOMER },
};

const tokens = {};

async function login(account) {
  const result = await loginUser(account.email, PASSWORD);
  expect(result.response.status).toBe(200);
  return result.tokens;
}

beforeAll(async () => {
  await startTestDatabase();
  await createAdmin({ ...ACCOUNTS.admin, password: PASSWORD });
  for (const account of Object.values(ACCOUNTS).filter((entry) => entry.role !== ROLES.ADMIN)) {
    await User.create({
      name: account.name,
      email: account.email,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      role: account.role,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    });
  }
  await getSettings();

  for (const [key, account] of Object.entries(ACCOUNTS)) {
    tokens[key] = await login(account);
  }
});

afterAll(async () => {
  await stopTestDatabase();
});

describe('role permission model', () => {
  it('gives customers no admin permissions and staff only operational permissions', () => {
    expect(ROLE_PERMISSIONS[ROLES.CUSTOMER]).toEqual([]);
    expect(permissionsForRole(ROLES.STAFF)).toEqual(
      expect.arrayContaining([
        PERMISSIONS.ADMIN_ACCESS,
        PERMISSIONS.ORDERS_STATUS_UPDATE,
        PERMISSIONS.RESERVATIONS_STATUS_UPDATE,
      ]),
    );
    expect(permissionsForRole(ROLES.STAFF)).not.toContain(PERMISSIONS.MENU_VIEW);
    expect(permissionsForRole(ROLES.STAFF)).not.toContain(PERMISSIONS.EMAILS_VIEW);
    expect(permissionsForRole(ROLES.STAFF)).not.toContain(PERMISSIONS.ORDERS_PAYMENT_UPDATE);
  });

  it('keeps privileged controls away from managers', () => {
    const manager = permissionsForRole(ROLES.MANAGER);
    expect(manager).toEqual(
      expect.arrayContaining([
        PERMISSIONS.DASHBOARD_STATS_VIEW,
        PERMISSIONS.MENU_ITEMS_VERIFY,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.SETTINGS_UPDATE,
      ]),
    );
    expect(manager).not.toContain(PERMISSIONS.STAFF_VIEW);
    expect(manager).not.toContain(PERMISSIONS.CUSTOMERS_ACCOUNT_MANAGE);
    expect(manager).not.toContain(PERMISSIONS.SETTINGS_SENSITIVE_UPDATE);
    expect(manager).not.toContain(PERMISSIONS.AUDIT_VIEW);
  });

  it('gives administrators the complete supported admin capability set', () => {
    const admin = permissionsForRole(ROLES.ADMIN);
    expect(admin).toEqual(
      expect.arrayContaining([
        PERMISSIONS.STAFF_CREATE,
        PERMISSIONS.STAFF_ROLES_ASSIGN,
        PERMISSIONS.CUSTOMERS_ACCOUNT_MANAGE,
        PERMISSIONS.SETTINGS_VERIFICATION_APPROVE,
        PERMISSIONS.AUDIT_VIEW,
      ]),
    );
  });
});

describe('admin API authorization', () => {
  it('rejects customers from all admin routes', async () => {
    await getWithAuth('/admin/ping', tokens.customer).expect(403);
    await getWithAuth('/admin/dashboard', tokens.customer).expect(403);
  });

  it('lets staff manage orders and reservations but blocks privileged modules', async () => {
    await getWithAuth('/admin/orders', tokens.staff).expect(200);
    await getWithAuth('/admin/reservations', tokens.staff).expect(200);

    await getWithAuth('/admin/dashboard', tokens.staff).expect(403);
    await getWithAuth('/admin/menu/items', tokens.staff).expect(403);
    await getWithAuth('/admin/customers', tokens.staff).expect(403);
    await getWithAuth('/admin/staff', tokens.staff).expect(403);
    await getWithAuth('/admin/emails', tokens.staff).expect(403);
    await getWithAuth('/admin/settings', tokens.staff).expect(403);
    await getWithAuth('/admin/audit-logs', tokens.staff).expect(403);
  });

  it('lets managers run daily operations but blocks staff, audit and sensitive settings', async () => {
    await getWithAuth('/admin/dashboard', tokens.manager).expect(200);
    await getWithAuth('/admin/menu/items', tokens.manager).expect(200);
    await getWithAuth('/admin/customers', tokens.manager).expect(200);
    await getWithAuth('/admin/emails', tokens.manager).expect(200);
    await getWithAuth('/admin/settings', tokens.manager).expect(200);

    await getWithAuth('/admin/staff', tokens.manager).expect(403);
    await getWithAuth('/admin/audit-logs', tokens.manager).expect(403);

    await patchWithCsrf(
      '/admin/settings',
      { verification: { contactApproved: true } },
      tokens.manager,
    ).expect(403);
  });

  it('lets administrators access every module and records sensitive changes', async () => {
    const dashboard = await getWithAuth('/admin/dashboard', tokens.admin).expect(200);
    expect(dashboard.body.data.summary).toEqual(
      expect.objectContaining({ totalOrders: 0, customers: 1 }),
    );

    const updated = await patchWithCsrf(
      '/admin/settings',
      { verification: { contactApproved: true } },
      tokens.admin,
    ).expect(200);
    expect(updated.body.data.settings.verification.contactApproved).toBe(true);

    const audit = await getWithAuth('/admin/audit-logs', tokens.admin).expect(200);
    expect(audit.body.data.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'settings.update', actorEmail: ACCOUNTS.admin.email }),
      ]),
    );
  });

  it('blocks managers from customer account controls but allows administrators', async () => {
    const customer = await User.findOne({ email: ACCOUNTS.customer.email });
    await patchWithCsrf(
      `/admin/customers/${customer.id}/status`,
      { status: USER_STATUS.SUSPENDED },
      tokens.manager,
    ).expect(403);

    const response = await patchWithCsrf(
      `/admin/customers/${customer.id}/status`,
      { status: USER_STATUS.SUSPENDED },
      tokens.admin,
    ).expect(200);
    expect(response.body.data.customer.status).toBe(USER_STATUS.SUSPENDED);

    await patchWithCsrf(
      `/admin/customers/${customer.id}/status`,
      { status: USER_STATUS.ACTIVE },
      tokens.admin,
    ).expect(200);
  });

  it('creates staff with a temporary password and requires a password change', async () => {
    const email = `new-staff-${Date.now()}@example.com`;
    const response = await postWithCsrf(
      '/admin/staff',
      { name: 'New Staff', email, role: ROLES.STAFF },
      tokens.admin,
    ).expect(201);

    expect(response.body.data.temporaryPassword).toMatch(/\S{16,}/);
    expect(response.body.data.user).toEqual(
      expect.objectContaining({ role: ROLES.STAFF, mustChangePassword: true }),
    );
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('prevents admins from changing their own role or status', async () => {
    const admin = await User.findOne({ email: ACCOUNTS.admin.email });
    await patchWithCsrf(`/admin/staff/${admin.id}`, { role: ROLES.MANAGER }, tokens.admin).expect(
      400,
    );
    await patchWithCsrf(
      `/admin/staff/${admin.id}`,
      { status: USER_STATUS.SUSPENDED },
      tokens.admin,
    ).expect(400);
  });

  it('protects the last active administrator through the service layer', async () => {
    const admin = await User.findOne({ email: ACCOUNTS.admin.email });
    const otherActor = { id: new mongoose.Types.ObjectId().toString(), role: ROLES.ADMIN };
    await expect(updateStaff(admin.id, { role: ROLES.MANAGER }, otherActor)).rejects.toThrow(
      /last active administrator/i,
    );
  });

  it('prevents a manager from verifying a menu item they changed', async () => {
    const suffix = Date.now();
    const category = await postWithCsrf(
      '/admin/menu/categories',
      {
        name: `Role Test ${suffix}`,
        slug: `role-test-${suffix}`,
        kind: 'food',
      },
      tokens.admin,
    ).expect(201);

    const created = await postWithCsrf(
      '/admin/menu/items',
      {
        name: `Role Item ${suffix}`,
        slug: `role-item-${suffix}`,
        categorySlug: category.body.data.category.slug,
        price: 1000,
      },
      tokens.manager,
    ).expect(201);

    const itemId = created.body.data.item.id;
    await patchWithCsrf(
      '/admin/menu/items/' + itemId,
      { name: `Role Item Edited ${suffix}` },
      tokens.manager,
    ).expect(200);
    await postWithCsrf(`/admin/menu/items/${itemId}/verify`, {}, tokens.manager).expect(403);

    const verified = await postWithCsrf(
      `/admin/menu/items/${itemId}/verify`,
      { note: 'Admin verified source' },
      tokens.admin,
    ).expect(200);
    expect(verified.body.data.item.verified).toBe(true);
  });

  it('returns 400 for malformed resource ids instead of a server error', async () => {
    const response = await getWithAuth('/admin/customers/not-an-object-id', tokens.admin).expect(
      400,
    );
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exposes audit entries only to administrators', async () => {
    await getWithAuth('/admin/audit-logs', tokens.admin).expect(200);
    await getWithAuth('/admin/audit-logs', tokens.manager).expect(403);
    expect(await AuditLog.countDocuments()).toBeGreaterThan(0);
  });
});
