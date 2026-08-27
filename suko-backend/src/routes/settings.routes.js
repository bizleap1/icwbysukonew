import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public — anyone can read store settings (needed by frontend)
router.get('/', getSettings);

// Admin only — update settings
router.put('/', authMiddleware, updateSettings);

export default router;
