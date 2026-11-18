export const PERMISSIONS = Object.freeze({
  ADMIN_ACCESS: 'admin.access',
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_STATS_VIEW: 'dashboard.stats.view',
  ORDERS_VIEW: 'orders.view',
  ORDERS_DETAILS_VIEW: 'orders.details.view',
  ORDERS_STATUS_UPDATE: 'orders.status.update',
  ORDERS_PAYMENT_UPDATE: 'orders.payment.update',
  RESERVATIONS_VIEW: 'reservations.view',
  RESERVATIONS_DETAILS_VIEW: 'reservations.details.view',
  RESERVATIONS_STATUS_UPDATE: 'reservations.status.update',
  RESERVATIONS_RESCHEDULE: 'reservations.reschedule',
  MENU_VIEW: 'menu.view',
  MENU_ITEMS_CREATE: 'menu.items.create',
  MENU_ITEMS_UPDATE: 'menu.items.update',
  MENU_ITEMS_VERIFY: 'menu.items.verify',
  MENU_ITEMS_ARCHIVE: 'menu.items.archive',
  MENU_ITEMS_RESTORE: 'menu.items.restore',
  MENU_CATEGORIES_MANAGE: 'menu.categories.manage',
  MENU_IMAGES_MANAGE: 'menu.images.manage',
  MENU_ISSUES_VIEW: 'menu.issues.view',
  MENU_ISSUES_RESOLVE: 'menu.issues.resolve',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_DETAILS_VIEW: 'customers.details.view',
  CUSTOMERS_ACCOUNT_MANAGE: 'customers.account.manage',
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_ROLES_ASSIGN: 'staff.roles.assign',
  STAFF_STATUS_UPDATE: 'staff.status.update',
  EMAILS_VIEW: 'emails.view',
  EMAILS_PROCESS: 'emails.process',
  EMAILS_RETRY: 'emails.retry',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_SENSITIVE_UPDATE: 'settings.sensitive.update',
  SETTINGS_VERIFICATION_APPROVE: 'settings.verification.approve',
  AUDIT_VIEW: 'audit.view',
});

export function can(user, permission) {
  return Boolean(user?.permissions?.includes(permission));
}

export function canAny(user, permissions) {
  return permissions.some((permission) => can(user, permission));
}

export function canAll(user, permissions) {
  return permissions.every((permission) => can(user, permission));
}
