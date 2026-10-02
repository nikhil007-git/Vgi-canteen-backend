import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getMyActiveOrders,
  submitRating
} from '../controllers/orderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const createOrderSchema = {
  phone: { type: 'string', required: true, isPhone: true },
  confirmPhone: { type: 'string', required: true, isPhone: true },
  items: {
    type: 'array',
    required: true,
    minItems: 1,
    maxItems: 50,
    itemValidator: (item) => {
      if (!item || typeof item !== 'object') {
        return { isValid: false, errors: ['Each item must be an object.'] };
      }
      if (!item.menuItemId || typeof item.menuItemId !== 'string') {
        return { isValid: false, errors: ['Item menuItemId is required.'] };
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return { isValid: false, errors: ['Item quantity must be between 1 and 50.'] };
      }
      return { isValid: true };
    }
  },
  couponCode: { type: 'string', required: false, maxLength: 50 },
  specialInstructions: { type: 'string', required: false, maxLength: 500 }
};

const ratingSchema = {
  stars: { type: 'number', required: true, integer: true, min: 1, max: 5 },
  review: { type: 'string', required: false, maxLength: 500 }
};

router.post('/', authenticate, validateBody(createOrderSchema, { allowUnknown: true }), createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/my-active', authenticate, getMyActiveOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/rate', authenticate, validateBody(ratingSchema, { allowUnknown: true }), submitRating);

export default router;

