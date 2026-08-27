import { Router } from 'express';
import { subscribeStockNotification, sendAdminBroadcastEmail } from '../controllers/stockNotification.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/subscribe', subscribeStockNotification);
router.post('/send-email', authMiddleware, adminMiddleware, sendAdminBroadcastEmail);

export default router;
