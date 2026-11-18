import { Router } from 'express';
import { accept } from '../controllers/invitation.controller.js';
import { validate } from '../middleware/validate.js';
import { formLimiter } from '../security/rateLimit.js';
import { acceptAdminInvitationSchema } from '../validators/invitation.validator.js';

const router = Router();

router.post('/accept', formLimiter, validate(acceptAdminInvitationSchema), accept);

export default router;
