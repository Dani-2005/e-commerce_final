const express = require('express');
const router = express.Router();
const { onlyUser } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');
const { onlyAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/comprobantes/' }); 

router.get('/admin/orders/pending', onlyAdmin, orderController.getPendingOrders);
router.put('/orders/:orderId', upload.single('captura_pago_movil'), orderController.payOrder);



router.use('/orders', onlyUser);

router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:orderId', orderController.getOrderById);
router.get('/orders/:orderId/items', orderController.getOrderItems);
router.delete('/orders/:orderId', orderController.deleteOrder);
router.put('/orders/:orderId', orderController.payOrder);
router.put('/orders/:orderId/confirmar', orderController.confirmOrderPayment);

router.get('/factura/:orderId', orderController.getFacturaOrden);

   


module.exports = router;
