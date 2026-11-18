import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { PERMISSIONS } from '../config/permissions.js';
import { sendSuccess } from '../utils/response.js';
import {
  archiveMenuItem,
  auditLogs,
  createMenuItem,
  createMenuCategory,
  createStaff,
  customerDetail,
  customers,
  dashboard,
  emails,
  menuCategories,
  menuImageDelete,
  menuImageStatus,
  menuImageUploadSignature,
  menuItems,
  menuReviewIssues,
  order,
  orders,
  processEmails,
  reservationDetail,
  rescheduleReservation,
  reservations,
  resolveMenuIssue,
  restoreMenuItem,
  retryEmail,
  setCustomerStatus,
  setMenuItemAvailability,
  settings,
  staff,
  update,
  updateMenuCategory,
  updateMenuItem,
  updateOrderPayment,
  updateOrderStatus,
  updateReservationStatus,
  updateStaff,
  verifyMenuItem,
} from '../controllers/admin.controller.js';
import {
  adminMenuItemUpdateSchema,
  adminMenuQuerySchema,
  cloudinaryDeleteSchema,
  resolveReviewIssueSchema,
  verifyMenuItemSchema,
} from '../validators/adminMenu.validator.js';
import {
  adminEmailQuerySchema,
  adminOrderPaymentSchema,
  adminOrderQuerySchema,
  adminOrderStatusSchema,
} from '../validators/order.validator.js';
import {
  adminReservationQuerySchema,
  adminReservationStatusSchema,
} from '../validators/reservation.validator.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';
import {
  auditQuerySchema,
  createMenuCategorySchema,
  createMenuItemSchema,
  createStaffSchema,
  customerQuerySchema,
  customerStatusSchema,
  menuAvailabilitySchema,
  rescheduleReservationSchema,
  staffQuerySchema,
  updateMenuCategorySchema,
  updateStaffSchema,
} from '../validators/adminManagement.validator.js';

const router = Router();

router.use(requireAuth, requirePermission(PERMISSIONS.ADMIN_ACCESS));

router.get('/ping', requirePermission(PERMISSIONS.ADMIN_ACCESS), (req, res) => {
  sendSuccess(res, { message: 'pong', role: req.user.role, permissions: req.user.permissions });
});

router.get('/dashboard', requirePermission(PERMISSIONS.DASHBOARD_STATS_VIEW), dashboard);

router.get(
  '/orders',
  requirePermission(PERMISSIONS.ORDERS_VIEW),
  validate(adminOrderQuerySchema, 'query'),
  orders,
);
router.get(
  '/orders/:id',
  requirePermission(PERMISSIONS.ORDERS_DETAILS_VIEW),
  validateObjectId('id', 'order id'),
  order,
);
router.patch(
  '/orders/:id/status',
  requirePermission(PERMISSIONS.ORDERS_STATUS_UPDATE),
  validateObjectId('id', 'order id'),
  validate(adminOrderStatusSchema),
  updateOrderStatus,
);
router.patch(
  '/orders/:id/payment',
  requirePermission(PERMISSIONS.ORDERS_PAYMENT_UPDATE),
  validateObjectId('id', 'order id'),
  validate(adminOrderPaymentSchema),
  updateOrderPayment,
);

router.get(
  '/reservations',
  requirePermission(PERMISSIONS.RESERVATIONS_VIEW),
  validate(adminReservationQuerySchema, 'query'),
  reservations,
);
router.get(
  '/reservations/:id',
  requirePermission(PERMISSIONS.RESERVATIONS_DETAILS_VIEW),
  validateObjectId('id', 'reservation id'),
  reservationDetail,
);
router.patch(
  '/reservations/:id/status',
  requirePermission(PERMISSIONS.RESERVATIONS_STATUS_UPDATE),
  validateObjectId('id', 'reservation id'),
  validate(adminReservationStatusSchema),
  updateReservationStatus,
);
router.patch(
  '/reservations/:id/reschedule',
  requirePermission(PERMISSIONS.RESERVATIONS_RESCHEDULE),
  validateObjectId('id', 'reservation id'),
  validate(rescheduleReservationSchema),
  rescheduleReservation,
);

router.get(
  '/emails',
  requirePermission(PERMISSIONS.EMAILS_VIEW),
  validate(adminEmailQuerySchema, 'query'),
  emails,
);
router.post('/emails/process', requirePermission(PERMISSIONS.EMAILS_PROCESS), processEmails);
router.post(
  '/emails/:id/retry',
  requirePermission(PERMISSIONS.EMAILS_RETRY),
  validateObjectId('id', 'email id'),
  retryEmail,
);

router.get(
  '/menu/items',
  requirePermission(PERMISSIONS.MENU_VIEW),
  validate(adminMenuQuerySchema, 'query'),
  menuItems,
);
router.post(
  '/menu/items',
  requirePermission(PERMISSIONS.MENU_ITEMS_CREATE),
  validate(createMenuItemSchema),
  createMenuItem,
);
router.get('/menu/categories', requirePermission(PERMISSIONS.MENU_VIEW), menuCategories);
router.post(
  '/menu/categories',
  requirePermission(PERMISSIONS.MENU_CATEGORIES_MANAGE),
  validate(createMenuCategorySchema),
  createMenuCategory,
);
router.patch(
  '/menu/categories/:id',
  requirePermission(PERMISSIONS.MENU_CATEGORIES_MANAGE),
  validateObjectId('id', 'category id'),
  validate(updateMenuCategorySchema),
  updateMenuCategory,
);
router.get(
  '/menu/review-issues',
  requirePermission(PERMISSIONS.MENU_ISSUES_VIEW),
  menuReviewIssues,
);
router.get(
  '/menu/images/status',
  requirePermission(PERMISSIONS.MENU_IMAGES_MANAGE),
  menuImageStatus,
);
router.post(
  '/menu/images/upload-signature',
  requirePermission(PERMISSIONS.MENU_IMAGES_MANAGE),
  menuImageUploadSignature,
);
router.post(
  '/menu/images/delete',
  requirePermission(PERMISSIONS.MENU_IMAGES_MANAGE),
  validate(cloudinaryDeleteSchema),
  menuImageDelete,
);
router.patch(
  '/menu/items/:id',
  requirePermission(PERMISSIONS.MENU_ITEMS_UPDATE),
  validateObjectId('id', 'menu item id'),
  validate(adminMenuItemUpdateSchema),
  updateMenuItem,
);
router.patch(
  '/menu/items/:id/availability',
  requirePermission(PERMISSIONS.MENU_ITEMS_UPDATE),
  validateObjectId('id', 'menu item id'),
  validate(menuAvailabilitySchema),
  setMenuItemAvailability,
);
router.post(
  '/menu/items/:id/verify',
  requirePermission(PERMISSIONS.MENU_ITEMS_VERIFY),
  validateObjectId('id', 'menu item id'),
  validate(verifyMenuItemSchema),
  verifyMenuItem,
);
router.post(
  '/menu/items/:id/archive',
  requirePermission(PERMISSIONS.MENU_ITEMS_ARCHIVE),
  validateObjectId('id', 'menu item id'),
  archiveMenuItem,
);
router.post(
  '/menu/items/:id/restore',
  requirePermission(PERMISSIONS.MENU_ITEMS_RESTORE),
  validateObjectId('id', 'menu item id'),
  restoreMenuItem,
);
router.post(
  '/menu/review-issues/:id/resolve',
  requirePermission(PERMISSIONS.MENU_ISSUES_RESOLVE),
  validateObjectId('id', 'review issue id'),
  validate(resolveReviewIssueSchema),
  resolveMenuIssue,
);

router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_VIEW), settings);
router.patch(
  '/settings',
  requirePermission(PERMISSIONS.SETTINGS_UPDATE),
  validate(updateSettingsSchema),
  update,
);

router.get(
  '/customers',
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  validate(customerQuerySchema, 'query'),
  customers,
);
router.get(
  '/customers/:id',
  requirePermission(PERMISSIONS.CUSTOMERS_DETAILS_VIEW),
  validateObjectId('id', 'customer id'),
  customerDetail,
);
router.patch(
  '/customers/:id/status',
  requirePermission(PERMISSIONS.CUSTOMERS_ACCOUNT_MANAGE),
  validateObjectId('id', 'customer id'),
  validate(customerStatusSchema),
  setCustomerStatus,
);

router.get(
  '/staff',
  requirePermission(PERMISSIONS.STAFF_VIEW),
  validate(staffQuerySchema, 'query'),
  staff,
);
router.post(
  '/staff',
  requirePermission(PERMISSIONS.STAFF_CREATE),
  validate(createStaffSchema),
  createStaff,
);
router.patch(
  '/staff/:id',
  requirePermission(PERMISSIONS.STAFF_UPDATE),
  validateObjectId('id', 'staff id'),
  validate(updateStaffSchema),
  updateStaff,
);

router.get(
  '/audit-logs',
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  validate(auditQuerySchema, 'query'),
  auditLogs,
);

export default router;
