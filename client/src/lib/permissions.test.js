import { describe, expect, it } from 'vitest';
import { can, canAll, canAny, PERMISSIONS } from './permissions.js';

const admin = {
  permissions: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.MENU_VIEW, PERMISSIONS.MENU_ITEMS_VERIFY],
};

const manager = {
  permissions: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.MENU_VIEW],
};

describe('client capabilities', () => {
  it('checks a single permission', () => {
    expect(can(admin, PERMISSIONS.MENU_ITEMS_VERIFY)).toBe(true);
    expect(can(manager, PERMISSIONS.MENU_ITEMS_VERIFY)).toBe(false);
    expect(can(null, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
  });

  it('checks any and all required permissions', () => {
    expect(canAny(manager, [PERMISSIONS.STAFF_VIEW, PERMISSIONS.MENU_VIEW])).toBe(true);
    expect(canAny(manager, [PERMISSIONS.STAFF_VIEW, PERMISSIONS.AUDIT_VIEW])).toBe(false);
    expect(canAll(admin, [PERMISSIONS.MENU_VIEW, PERMISSIONS.MENU_ITEMS_VERIFY])).toBe(true);
    expect(canAll(manager, [PERMISSIONS.MENU_VIEW, PERMISSIONS.MENU_ITEMS_VERIFY])).toBe(false);
  });

  it('uses the shared admin access key for protected routes', () => {
    expect(PERMISSIONS.ADMIN_ACCESS).toBe('admin.access');
    expect(can(manager, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
  });
});
