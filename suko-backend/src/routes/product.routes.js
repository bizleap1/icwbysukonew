const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  createProductWithImage,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const upload = require('../middleware/upload.middleware');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authMiddleware, adminOnly, createProduct);
router.post('/upload', authMiddleware, adminOnly, uploadFields, createProductWithImage);
router.put('/:id', authMiddleware, adminOnly, uploadFields, updateProduct);
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);

module.exports = router;
