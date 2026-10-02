import { Router } from 'express';
import {
  validateCoupon,
  getActiveCoupons,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.post('/validate', validateCoupon);
router.get('/active', getActiveCoupons);

// Admin routes
router.get('/admin', authenticate, requireAdmin, getAdminCoupons);
router.post('/admin', authenticate, requireAdmin, createCoupon);
router.put('/admin/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCoupon);

export default router;

