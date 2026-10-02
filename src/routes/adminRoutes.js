import { Router } from 'express';
import {
  getAdminOrders,
  updateOrderStatus,
  verifyPickup,
  getDashboardKPIs
} from '../controllers/adminOrderController.js';
import { getAnalyticsReport } from '../controllers/reportsController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { pickupLimiter } from '../middlewares/rateLimiter.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, requireAdmin);

const updateStatusSchema = {
  status: {
    type: 'string',
    required: true,
    enum: ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
  },
  prepTimeMinutes: { type: 'number', required: false, integer: true, min: 1, max: 300 },
  cancelReason: { type: 'string', required: false, maxLength: 500 }
};

const verifyPickupSchema = {
  pickupCode: { type: 'string', required: false, maxLength: 30 },
  orderId: { type: 'string', required: false, maxLength: 100 }
};

router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', validateBody(updateStatusSchema, { allowUnknown: true }), updateOrderStatus);
router.post('/orders/verify-pickup', pickupLimiter, validateBody(verifyPickupSchema, { allowUnknown: true }), verifyPickup);
router.get('/kpis', getDashboardKPIs);
router.get('/analytics', getAnalyticsReport);

export default router;

