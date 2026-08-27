import { Router } from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

const viewRoles = authorizeRoles('inventory_staff', 'store_manager', 'admin', 'super_admin');
const manageRoles = authorizeRoles('store_manager', 'admin', 'super_admin');

router.get('/', viewRoles, getAllSuppliers);
router.get('/:id', viewRoles, getSupplierById);
router.post('/', manageRoles, createSupplier);
router.put('/:id', manageRoles, updateSupplier);
router.delete('/:id', manageRoles, deleteSupplier);

export default router;
