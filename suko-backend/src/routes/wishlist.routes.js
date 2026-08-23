const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { getWishlist, toggleWishlist, removeFromWishlist } = require('../controllers/wishlist.controller');

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
