import { Router } from 'express';
import { csrf, login, logout, me, refresh, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { authLimiter, refreshLimiter } from '../security/rateLimit.js';

const router = Router();

router.get('/csrf', csrf);

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
