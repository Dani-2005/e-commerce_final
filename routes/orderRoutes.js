const express = require('express');
const router = express.Router();
const { onlyUser } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.use('/orders', onlyUser);


router.post('/orders', onlyUser, orderController.createOrder);
router.get('/orders', onlyUser, orderController.getOrders);
router.get('/orders', onlyUser, orderController.getOrders);
router.get('/orders/:orderId', onlyUser, orderController.getOrderById);
router.delete('/orders/:orderId', onlyUser, orderController.deleteOrder);
router.put('/orders/:orderId', onlyUser, orderController.payOrder);

module.exports = router;