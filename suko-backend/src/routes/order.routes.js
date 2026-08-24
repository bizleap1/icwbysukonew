const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  requestOrderCancellation, 
  getAllOrdersAdmin, 
  updateOrderStatusAdmin,
  deleteOrderAdmin
} = require('../controllers/order.controller');

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getMyOrders);
router.get('/all', authMiddleware, adminOnly, getAllOrdersAdmin);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/status', authMiddleware, adminOnly, updateOrderStatusAdmin);
router.patch('/:id/cancel', authMiddleware, requestOrderCancellation);
router.delete('/:id', authMiddleware, adminOnly, deleteOrderAdmin);

module.exports = router;
