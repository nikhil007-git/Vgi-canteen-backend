import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getMyActiveOrders,
  submitRating
} from '../controllers/orderController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/my-active', authenticate, getMyActiveOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/rate', authenticate, submitRating);

export default router;

