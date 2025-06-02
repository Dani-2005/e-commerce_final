const express = require('express');
const router = express.Router();
const { onlyUser } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

router.post('/cart', onlyUser, cartController.saveCart);
router.get('/cart', onlyUser, cartController.getCart);
router.get('/cart/:cartId/items', onlyUser, cartController.getCartItems);

module.exports = router;
