import { Router } from 'express';
import { getAdminStats } from '../controllers/stats.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Stats accessible by store_manager, admin, super_admin
router.get('/', authMiddleware, authorizeRoles('store_manager', 'admin'), getAdminStats);

export default router;
