import { Router } from 'express';
import { cancel, create, mine } from '../controllers/reservation.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../security/rateLimit.js';
import { reservationSchema } from '../validators/public.validator.js';
import { cancelReservationSchema } from '../validators/reservation.validator.js';

const router = Router();

router.post('/', formLimiter, optionalAuth, validate(reservationSchema), create);
router.get('/mine', requireAuth, mine);
router.post(
  '/:reference/cancel',
  formLimiter,
  optionalAuth,
  validate(cancelReservationSchema),
  cancel,
);

export default router;
