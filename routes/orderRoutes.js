const express = require('express');
const router = express.Router();
const { onlyUser } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.use('/orders', onlyUser);

router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:orderId', orderController.getOrderById);
router.delete('/orders/:orderId', orderController.deleteOrder);

// Solo una ruta para pagar la orden, usa el nombre correcto del controlador
router.put('/orders/:orderId', orderController.payOrder);

router.get('/factura/:orderId', orderController.getFacturaOrden);

module.exports = router;
