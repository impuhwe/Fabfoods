export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const STAFF_ROLES = Object.freeze([ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN]);

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
});

export const USER_STATUS_VALUES = Object.freeze(Object.values(USER_STATUS));

export const PAYMENT_METHODS = Object.freeze({
  MOBILE_MONEY: 'mobile_money',
  BANK_CARD: 'bank_card',
  PAY_AT_RESTAURANT: 'pay_at_restaurant',
  CASH_ON_DELIVERY: 'cash_on_delivery',
});

export const PAYMENT_METHOD_VALUES = Object.freeze(Object.values(PAYMENT_METHODS));

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  REQUIRES_ACTION: 'requires_action',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

export const PAYMENT_STATUS_VALUES = Object.freeze(Object.values(PAYMENT_STATUSES));

export const ORDER_STATUSES = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUSES));

export const FULFILLMENT_TYPES = Object.freeze({
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
});

export const FULFILLMENT_TYPE_VALUES = Object.freeze(Object.values(FULFILLMENT_TYPES));

export const RESERVATION_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
});

export const RESERVATION_STATUS_VALUES = Object.freeze(Object.values(RESERVATION_STATUSES));

export const EMAIL_STATUSES = Object.freeze({
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
});

export const EMAIL_STATUS_VALUES = Object.freeze(Object.values(EMAIL_STATUSES));

export const PAYMENT_PROVIDERS = Object.freeze({
  FLUTTERWAVE: 'flutterwave',
  DISABLED: 'disabled',
});

export const PAYMENT_PROVIDER_VALUES = Object.freeze(Object.values(PAYMENT_PROVIDERS));

export const MENU_CATEGORY_KINDS = Object.freeze({
  FOOD: 'food',
  DRINK: 'drink',
  DESSERT: 'dessert',
});

export const MENU_CATEGORY_KIND_VALUES = Object.freeze(Object.values(MENU_CATEGORY_KINDS));

export const ADDON_SELECTION_TYPES = Object.freeze({
  SINGLE: 'single',
  MULTIPLE: 'multiple',
});

export const ADDON_SELECTION_TYPE_VALUES = Object.freeze(Object.values(ADDON_SELECTION_TYPES));

export const MENU_DATA_SOURCES = Object.freeze({
  BRIEF: 'brief',
  PDF: 'pdf',
  ADMIN: 'admin',
});

export const MENU_DATA_SOURCE_VALUES = Object.freeze(Object.values(MENU_DATA_SOURCES));

export const MENU_REVIEW_STATUSES = Object.freeze({
  NEEDS_REVIEW: 'needs-review',
  SPELLING: 'spelling',
  AMBIGUOUS: 'ambiguous',
  VERIFIED: 'verified',
});

export const MENU_REVIEW_STATUS_VALUES = Object.freeze(Object.values(MENU_REVIEW_STATUSES));

export const MENU_REVIEW_ISSUE_STATUSES = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
});

export const MENU_REVIEW_ISSUE_STATUS_VALUES = Object.freeze(
  Object.values(MENU_REVIEW_ISSUE_STATUSES),
);

export const MENU_ORDER_BLOCKING_REVIEW_TAGS = Object.freeze([
  'addon-parent',
  'category',
  'category-mismatch',
  'choices',
  'duplicate-name',
  'layout',
  'modeling',
  'name',
  'serving-choice',
  'size-variation',
  'spelling',
]);

export const COOKIE_NAMES = Object.freeze({
  ACCESS: 'ff_access',
  REFRESH: 'ff_refresh',
  CSRF: 'ff_csrf',
});

export const CSRF_HEADER = 'x-csrf-token';

export const API_PREFIX = '/api/v1';
