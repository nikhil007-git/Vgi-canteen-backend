import { Router } from 'express';
import {
  getAdminOrders,
  updateOrderStatus,
  verifyPickup,
  getDashboardKPIs
} from '../controllers/adminOrderController.js';
import { getAnalyticsReport } from '../controllers/reportsController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, requireAdmin);

router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/verify-pickup', verifyPickup);
router.get('/kpis', getDashboardKPIs);
router.get('/analytics', getAnalyticsReport);

export default router;

