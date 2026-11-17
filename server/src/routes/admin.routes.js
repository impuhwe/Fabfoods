import { Router } from 'express';
import { ROLES } from '../config/constants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import {
  archiveMenuItem,
  emails,
  menuCategories,
  menuItems,
  menuReviewIssues,
  order,
  orders,
  processEmails,
  reservations,
  resolveMenuIssue,
  restoreMenuItem,
  retryEmail,
  settings,
  update,
  updateMenuItem,
  updateOrderPayment,
  updateOrderStatus,
  updateReservationStatus,
  verifyMenuItem,
} from '../controllers/admin.controller.js';
import {
  adminMenuItemUpdateSchema,
  adminMenuQuerySchema,
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

const router = Router();

router.use(requireAuth, requireRole(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN));

router.get(
  '/ping',
  requireRole(ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN),
  (req, res) => {
    sendSuccess(res, { message: 'pong', role: req.user.role });
  },
);

router.get('/orders', validate(adminOrderQuerySchema, 'query'), orders);
router.get('/orders/:id', order);
router.patch(
  '/orders/:id/status',
  validate(adminOrderStatusSchema),
  updateOrderStatus,
);
router.patch(
  '/orders/:id/payment',
  validate(adminOrderPaymentSchema),
  updateOrderPayment,
);

router.get(
  '/reservations',
  validate(adminReservationQuerySchema, 'query'),
  reservations,
);
router.patch(
  '/reservations/:id/status',
  validate(adminReservationStatusSchema),
  updateReservationStatus,
);

router.get('/emails', validate(adminEmailQuerySchema, 'query'), emails);
router.post('/emails/process', processEmails);
router.post('/emails/:id/retry', retryEmail);

router.get(
  '/menu/items',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(adminMenuQuerySchema, 'query'),
  menuItems,
);
router.get(
  '/menu/categories',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  menuCategories,
);
router.get(
  '/menu/review-issues',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  menuReviewIssues,
);
router.patch(
  '/menu/items/:id',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(adminMenuItemUpdateSchema),
  updateMenuItem,
);
router.post(
  '/menu/items/:id/verify',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(verifyMenuItemSchema),
  verifyMenuItem,
);
router.post(
  '/menu/items/:id/archive',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  archiveMenuItem,
);
router.post(
  '/menu/items/:id/restore',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  restoreMenuItem,
);
router.post(
  '/menu/review-issues/:id/resolve',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(resolveReviewIssueSchema),
  resolveMenuIssue,
);

router.get('/settings', requireRole(ROLES.MANAGER, ROLES.ADMIN), settings);
router.patch(
  '/settings',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(updateSettingsSchema),
  update,
);

export default router;
