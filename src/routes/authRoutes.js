import { Router } from 'express';
import { register, login, getMe, updateProfile, updateAdminCredentials, syncClerkUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/sync-clerk', syncClerkUser);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.patch('/admin/credentials', authenticate, updateAdminCredentials);

export default router;
