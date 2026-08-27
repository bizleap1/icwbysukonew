import { Router } from 'express';
import { getWishlist, toggleWishlist, removeWishlistItem } from '../controllers/wishlist.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/', toggleWishlist);
router.delete('/:id', removeWishlistItem);

export default router;
