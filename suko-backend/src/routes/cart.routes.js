const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem } = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.put('/:id', authMiddleware, updateCartItem);
router.delete('/:id', authMiddleware, removeCartItem);

module.exports = router;
