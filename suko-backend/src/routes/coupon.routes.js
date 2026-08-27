import { Router } from 'express';
import { applyCoupon, getCoupons, createCoupon, deleteCoupon } from '../controllers/coupon.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/apply', applyCoupon);
router.get('/', authMiddleware, adminMiddleware, getCoupons);
router.post('/', authMiddleware, adminMiddleware, createCoupon);
router.post('/create', authMiddleware, adminMiddleware, createCoupon);
router.put('/:id', authMiddleware, adminMiddleware, createCoupon);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCoupon);

export default router;
