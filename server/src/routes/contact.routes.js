import { Router } from 'express';
import { create } from '../controllers/contact.controller.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../security/rateLimit.js';
import { contactSchema } from '../validators/public.validator.js';

const router = Router();

router.post('/', formLimiter, validate(contactSchema), create);

export default router;
