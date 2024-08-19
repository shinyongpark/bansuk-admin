const express = require('express');
const router = express.Router();
const { getOrders, addOrder } = require('../controllers/orderController');

router.get('/orders', getOrders);
router.post('/orders', addOrder);

module.exports = router;
