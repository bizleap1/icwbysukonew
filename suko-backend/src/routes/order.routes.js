import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getInvoice,
  resetAllOrdersController,
} from '../controllers/order.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/my-orders', getMyOrders);
router.post('/:id/cancel', cancelOrder);
router.get('/:id/invoice', getInvoice);

// Admin endpoints
router.get('/all', adminMiddleware, getAllOrders);
router.put('/:id/status', adminMiddleware, updateOrderStatus);
router.post('/reset-all', adminMiddleware, resetAllOrdersController);

export default router;

