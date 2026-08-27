import { Router } from 'express';
import { getUnifiedCustomers, getCustomerDetails } from '../controllers/customer.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

const staffRoles = authorizeRoles('inventory_staff', 'cashier', 'store_manager', 'admin', 'super_admin');

router.get('/', staffRoles, getUnifiedCustomers);
router.get('/:identifier', staffRoles, getCustomerDetails);

export default router;
