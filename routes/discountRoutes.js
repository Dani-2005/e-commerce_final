const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.get('/discounts/most-sold', discountController.getMostSoldProducts);
router.get('/discounts/discounted-products', discountController.getDiscountedProducts);

module.exports = router;