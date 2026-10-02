import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/canteenController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const updateSettingsSchema = {
  status: { type: 'string', required: false, enum: ['OPEN', 'BUSY', 'CLOSED'] },
  maxActiveOrders: { type: 'number', required: false, integer: true, min: 1, max: 500 },
  openTime: { type: 'string', required: false, maxLength: 20 },
  closeTime: { type: 'string', required: false, maxLength: 20 },
  contactPhone: { type: 'string', required: false, maxLength: 30 },
  contactWhatsapp: { type: 'string', required: false, maxLength: 30 },
  announcement: { type: 'string', required: false, maxLength: 500 }
};

router.get('/status', getSettings);
router.put('/settings', authenticate, requireAdmin, validateBody(updateSettingsSchema, { allowUnknown: true }), updateSettings);

export default router;

