export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
});

export const STAFF_ROLES = Object.freeze([ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN]);
