import { Router } from 'express';
import {
  changePassword,
  order,
  orders,
  updateProfile,
} from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/account.validator.js';

const router = Router();

router.use(requireAuth);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.post('/password', validate(changePasswordSchema), changePassword);
router.get('/orders', orders);
router.get('/orders/:orderNumber', order);

export default router;
