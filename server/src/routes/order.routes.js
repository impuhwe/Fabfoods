import { Router } from 'express';
import {
  cancel,
  create,
  get,
  initiatePayment,
  mine,
  quote,
  verifyPayment,
} from '../controllers/order.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../security/rateLimit.js';
import {
  cancelOrderSchema,
  createOrderSchema,
  initiatePaymentSchema,
  orderLookupSchema,
} from '../validators/order.validator.js';
import { quoteSchema } from '../validators/public.validator.js';

const router = Router();

router.post('/quote', validate(quoteSchema), quote);
router.post('/', formLimiter, optionalAuth, validate(createOrderSchema), create);
router.get('/mine', requireAuth, mine);
router.get('/:orderNumber', optionalAuth, validate(orderLookupSchema, 'query'), get);
router.post(
  '/:orderNumber/cancel',
  formLimiter,
  optionalAuth,
  validate(cancelOrderSchema),
  cancel,
);
router.post(
  '/:orderNumber/payments/initiate',
  formLimiter,
  optionalAuth,
  validate(initiatePaymentSchema),
  initiatePayment,
);
router.post(
  '/:orderNumber/payments/verify',
  formLimiter,
  optionalAuth,
  validate(orderLookupSchema),
  verifyPayment,
);

export default router;
