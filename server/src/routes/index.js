import { Router } from 'express';
import { API_PREFIX } from '../config/constants.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import healthRoutes from './health.routes.js';
import menuRoutes from './menu.routes.js';
import reservationRoutes from './reservation.routes.js';
import contactRoutes from './contact.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import accountRoutes from './account.routes.js';
import settingsRoutes from './settings.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/reservations', reservationRoutes);
router.use('/contact', contactRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/me', accountRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);

export { API_PREFIX };
export default router;
