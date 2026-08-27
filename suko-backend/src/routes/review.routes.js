import { Router } from 'express';
import { addReview, deleteReview, getAllReviews } from '../controllers/review.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/all', authMiddleware, adminMiddleware, getAllReviews);
router.post('/', authMiddleware, addReview);
router.delete('/:id', authMiddleware, adminMiddleware, deleteReview);

export default router;
