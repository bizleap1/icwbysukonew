const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { getStats } = require('../controllers/stats.controller');

router.get('/', authMiddleware, adminOnly, getStats);

module.exports = router;
