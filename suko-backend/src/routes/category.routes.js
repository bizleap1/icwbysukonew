const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, deleteCategory } = require('../controllers/category.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

router.get('/', getAllCategories);
router.post('/', authMiddleware, adminOnly, createCategory);
router.delete('/:id', authMiddleware, adminOnly, deleteCategory);

module.exports = router;
