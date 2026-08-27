import { Router } from 'express';
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  receivePurchase,
  cancelPurchase,
} from '../controllers/purchase.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

// Roles
const viewRoles = authorizeRoles('inventory_staff', 'store_manager', 'admin', 'super_admin');
const inwardRoles = authorizeRoles('inventory_staff', 'store_manager', 'admin', 'super_admin');
const manageRoles = authorizeRoles('store_manager', 'admin', 'super_admin');

router.get('/', viewRoles, getAllPurchases);
router.get('/:id', viewRoles, getPurchaseById);
router.post('/', inwardRoles, createPurchase);
router.put('/:id', manageRoles, updatePurchase);
router.post('/:id/receive', inwardRoles, receivePurchase);
router.post('/:id/cancel', manageRoles, cancelPurchase);

export default router;
