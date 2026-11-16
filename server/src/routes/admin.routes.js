import { Router } from 'express';
import { ROLES } from '../config/constants.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import {
  emails,
  order,
  orders,
  processEmails,
  reservations,
  retryEmail,
  settings,
  update,
  updateOrderPayment,
  updateOrderStatus,
  updateReservationStatus,
} from '../controllers/admin.controller.js';
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

router.get('/settings', requireRole(ROLES.MANAGER, ROLES.ADMIN), settings);
router.patch(
  '/settings',
  requireRole(ROLES.MANAGER, ROLES.ADMIN),
  validate(updateSettingsSchema),
  update,
);

export default router;
