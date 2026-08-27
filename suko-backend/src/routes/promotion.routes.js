import { Router } from 'express';
import {
  getPromotions,
  applyPromotion,
  revertPromotion,
  quickUpdateProductPrice,
  deletePromotion,
  clearRevertedHistory,
  updateCampaign,
} from '../controllers/promotion.controller.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public: Get promotions
router.get('/', getPromotions);

// Admin Only: Apply, revert, edit, and delete
router.post('/apply', authMiddleware, adminMiddleware, applyPromotion);
router.post('/revert/:id', authMiddleware, adminMiddleware, revertPromotion);
router.put('/product/:id', authMiddleware, adminMiddleware, quickUpdateProductPrice);
router.put('/:id', authMiddleware, adminMiddleware, updateCampaign);
router.delete('/clear-history', authMiddleware, adminMiddleware, clearRevertedHistory);
router.delete('/:id', authMiddleware, adminMiddleware, deletePromotion);

export default router;
