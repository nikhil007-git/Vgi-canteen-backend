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
import { couponLimiter } from '../middlewares/rateLimiter.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const validateCouponSchema = {
  code: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  subtotal: { type: 'number', required: true, min: 0 }
};

const createCouponSchema = {
  code: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  description: { type: 'string', required: false, maxLength: 300 },
  type: { type: 'string', required: true, enum: ['PERCENTAGE', 'FIXED'] },
  value: { type: 'number', required: true, min: 0.01, max: 100000 },
  minOrder: { type: 'number', required: false, min: 0 },
  maxDiscount: { type: 'number', required: false, min: 0 },
  usageLimit: { type: 'number', required: false, integer: true, min: 1 },
  perUserLimit: { type: 'number', required: false, integer: true, min: 1 },
  startAt: { type: 'string', required: false },
  endAt: { type: 'string', required: false }
};

// Public routes
router.post('/validate', couponLimiter, validateBody(validateCouponSchema, { allowUnknown: true }), validateCoupon);
router.get('/active', getActiveCoupons);

// Admin routes
router.get('/admin', authenticate, requireAdmin, getAdminCoupons);
router.post('/admin', authenticate, requireAdmin, validateBody(createCouponSchema, { allowUnknown: true }), createCoupon);
router.put('/admin/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCoupon);

export default router;

