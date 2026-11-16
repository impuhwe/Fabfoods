import { Router } from 'express';
import { categories, item, items, meta } from '../controllers/publicMenu.controller.js';
import { validate } from '../middleware/validate.js';
import { menuQuerySchema } from '../validators/public.validator.js';

const router = Router();

router.get('/categories', categories);
router.get('/meta', meta);
router.get('/items', validate(menuQuerySchema, 'query'), items);
router.get('/items/:slug', item);

export default router;
