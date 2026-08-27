const express = require('express');
const router = express.Router();
const { validateCoupon, getAllCoupons, createCoupon, deleteCoupon } = require('../controllers/coupon.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

router.post('/validate', validateCoupon);
router.post('/apply', validateCoupon);
router.get('/', authMiddleware, adminOnly, getAllCoupons);
router.post('/', authMiddleware, adminOnly, createCoupon);
router.delete('/:id', authMiddleware, adminOnly, deleteCoupon);

module.exports = router;
