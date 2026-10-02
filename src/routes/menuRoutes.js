import { Router } from 'express';
import {
  getCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleSoldOut,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/menuController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Public routes
router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItemById);

// Admin category routes
router.post('/categories', authenticate, requireAdmin, createCategory);
router.put('/categories/:id', authenticate, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, deleteCategory);

// Admin item routes
router.post('/items', authenticate, requireAdmin, createMenuItem);
router.put('/items/:id', authenticate, requireAdmin, updateMenuItem);
router.delete('/items/:id', authenticate, requireAdmin, deleteMenuItem);
router.patch('/items/:id/sold-out', authenticate, requireAdmin, toggleSoldOut);

export default router;

