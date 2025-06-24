const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');

router.get('/discounts/most-sold', discountController.getMostSoldProducts);
router.get('/discounts/discounted-products', discountController.getDiscountedProducts);
router.post('/products/discount-group', discountController.applyGroupDiscount);

module.exports = router;