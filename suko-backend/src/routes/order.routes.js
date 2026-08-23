const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder, deleteOrder, editOrderAdmin } = require('../controllers/order.controller');

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getMyOrders);
router.get('/all', authMiddleware, adminOnly, getAllOrders);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/status', authMiddleware, adminOnly, updateOrderStatus);
router.patch('/:id/cancel', authMiddleware, cancelOrder);
router.put('/:id', authMiddleware, adminOnly, editOrderAdmin);
router.delete('/:id', authMiddleware, adminOnly, deleteOrder);

module.exports = router;
