import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', authMiddleware, authorizeRoles('admin', 'super_admin', 'store_manager', 'inventory_staff'), upload.array('images', 5), createProduct);
router.put('/:id', authMiddleware, authorizeRoles('admin', 'super_admin', 'store_manager', 'inventory_staff'), upload.array('images', 5), updateProduct);
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'super_admin', 'store_manager', 'inventory_staff'), deleteProduct);

export default router;

