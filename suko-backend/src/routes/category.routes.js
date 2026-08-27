import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from '../controllers/category.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getCategories);
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

export default router;
