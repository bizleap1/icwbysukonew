import { Router } from 'express';
import { getAddresses, addAddress, deleteAddress } from '../controllers/address.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAddresses);
router.post('/', addAddress);
router.delete('/:id', deleteAddress);

export default router;
