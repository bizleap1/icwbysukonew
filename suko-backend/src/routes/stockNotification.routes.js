const express = require('express');
const router = express.Router();
const { subscribeStockAlert } = require('../controllers/stockNotification.controller');

router.post('/', subscribeStockAlert);

module.exports = router;
