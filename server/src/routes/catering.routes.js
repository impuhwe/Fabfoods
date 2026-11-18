import { Router } from 'express';
import { create } from '../controllers/catering.controller.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../security/rateLimit.js';
import { cateringRequestSchema } from '../validators/catering.validator.js';

const router = Router();

router.post('/', formLimiter, validate(cateringRequestSchema), create);

export default router;
