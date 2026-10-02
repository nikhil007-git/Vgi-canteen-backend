import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAdminCredentials,
  syncClerkUser
} from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public Authentication Endpoints (Strictly Rate-Limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/sync-clerk', authLimiter, syncClerkUser);

// Authenticated User Endpoints
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

// Administrative Credentials Management
router.patch('/admin/credentials', authenticate, requireAdmin, updateAdminCredentials);

export default router;

