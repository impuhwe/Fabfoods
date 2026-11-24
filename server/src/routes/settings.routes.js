import { Router } from 'express';
import { publicSettings } from '../controllers/admin.controller.js';

const router = Router();

router.get('/public', publicSettings);

export default router;
