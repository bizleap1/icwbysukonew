const express = require('express');
const router = express.Router();
const { 
  getCart, 
  addToCart, 
  mergeCart, 
  updateCartItem, 
  removeCartItem 
} = require('../controllers/cart.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/merge', mergeCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);

module.exports = router;
