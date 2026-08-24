const express = require('express');
const router = express.Router();
const { 
  getWishlist, 
  toggleWishlist, 
  mergeWishlist, 
  removeFromWishlist 
} = require('../controllers/wishlist.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', toggleWishlist);
router.post('/merge', mergeWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
