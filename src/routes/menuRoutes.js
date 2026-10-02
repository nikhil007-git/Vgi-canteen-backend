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
import { validateBody } from '../middlewares/validate.js';

const router = Router();

const createCategorySchema = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  sortOrder: { type: 'number', required: false, integer: true }
};

const updateCategorySchema = {
  name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  sortOrder: { type: 'number', required: false, integer: true },
  active: { type: 'boolean', required: false }
};

const createMenuItemSchema = {
  categoryId: { type: 'string', required: true, minLength: 1 },
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  price: { type: 'number', required: true, min: 0, max: 100000 },
  imageUrl: { type: 'string', required: false, maxLength: 1000 },
  prepTime: { type: 'number', required: false, integer: true, min: 1, max: 300 },
  isPopular: { type: 'boolean', required: false },
  isFeatured: { type: 'boolean', required: false },
  stockMode: { type: 'string', required: false, enum: ['QUANTITY', 'MANUAL'] },
  stockQty: { type: 'number', required: false, integer: true, min: 0, max: 10000 },
  soldOut: { type: 'boolean', required: false }
};

const updateMenuItemSchema = {
  categoryId: { type: 'string', required: false, minLength: 1 },
  name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  price: { type: 'number', required: false, min: 0, max: 100000 },
  imageUrl: { type: 'string', required: false, maxLength: 1000 },
  prepTime: { type: 'number', required: false, integer: true, min: 1, max: 300 },
  isPopular: { type: 'boolean', required: false },
  isFeatured: { type: 'boolean', required: false },
  stockMode: { type: 'string', required: false, enum: ['QUANTITY', 'MANUAL'] },
  stockQty: { type: 'number', required: false, integer: true, min: 0, max: 10000 },
  soldOut: { type: 'boolean', required: false },
  active: { type: 'boolean', required: false }
};

// Public routes
router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItemById);

// Admin category routes
router.post('/categories', authenticate, requireAdmin, validateBody(createCategorySchema, { allowUnknown: true }), createCategory);
router.put('/categories/:id', authenticate, requireAdmin, validateBody(updateCategorySchema, { allowUnknown: true }), updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, deleteCategory);

// Admin item routes
router.post('/items', authenticate, requireAdmin, validateBody(createMenuItemSchema, { allowUnknown: true }), createMenuItem);
router.put('/items/:id', authenticate, requireAdmin, validateBody(updateMenuItemSchema, { allowUnknown: true }), updateMenuItem);
router.delete('/items/:id', authenticate, requireAdmin, deleteMenuItem);
router.patch('/items/:id/sold-out', authenticate, requireAdmin, toggleSoldOut);

export default router;

