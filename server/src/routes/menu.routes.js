import { Router } from 'express';
import { categories, item, items, meta } from '../controllers/publicMenu.controller.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { validate } from '../middleware/validate.js';
import { menuQuerySchema } from '../validators/public.validator.js';

const router = Router();

router.get('/categories', requireDatabase, categories);
router.get('/meta', requireDatabase, meta);
router.get('/items', requireDatabase, validate(menuQuerySchema, 'query'), items);
router.get('/items/:slug', requireDatabase, item);

export default router;
