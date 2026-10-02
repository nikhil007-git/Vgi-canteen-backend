import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/canteenController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/status', getSettings);
router.put('/settings', authenticate, requireAdmin, updateSettings);

export default router;

