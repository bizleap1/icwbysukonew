const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { 
  createRazorpayOrder, 
  verifyPayment 
} = require('../controllers/payment.controller');

router.post('/create-order', authMiddleware, createRazorpayOrder);
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router;
