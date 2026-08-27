import { Router } from 'express';
import {
  createReturnRequest,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
  createPosDirectReturnOrExchange,
} from '../controllers/return.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

const staffRoles = authorizeRoles('inventory_staff', 'cashier', 'store_manager', 'admin', 'super_admin');
const managerRoles = authorizeRoles('store_manager', 'admin', 'super_admin');

router.post('/', createReturnRequest); // Customers & Staff can submit return requests
router.get('/', staffRoles, getAllReturns);
router.get('/:id', staffRoles, getReturnById);
router.put('/:id/status', managerRoles, updateReturnStatus);
router.post('/pos-direct', staffRoles, createPosDirectReturnOrExchange);

export default router;
