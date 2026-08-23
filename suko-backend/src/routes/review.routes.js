const express = require('express');
const router = express.Router();
const { getProductReviews, addReview, getAllReviews, deleteReview } = require('../controllers/review.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

router.get('/product/:productId', getProductReviews);
router.get('/all', authMiddleware, adminOnly, getAllReviews);
router.post('/', authMiddleware, addReview);
router.delete('/:id', authMiddleware, adminOnly, deleteReview);

module.exports = router;
