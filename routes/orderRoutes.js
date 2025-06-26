const express = require('express');
const router = express.Router();
const { onlyUser } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.use('/orders', onlyUser);

router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:orderId', orderController.getOrderById);
router.get('/orders/:orderId/items', orderController.getOrderItems);
router.delete('/orders/:orderId', orderController.deleteOrder);
router.put('/orders/:orderId', orderController.payOrder);

router.get('/factura/:orderId', orderController.getFacturaOrden);

module.exports = router;
