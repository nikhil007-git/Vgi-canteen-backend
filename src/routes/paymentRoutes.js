import { Router } from 'express';
import { verifyPayment, handleWebhook } from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', handleWebhook);

export default router;

