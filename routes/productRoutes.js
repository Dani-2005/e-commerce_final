const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configuración de multer para subir archivos



router.get('/products', productController.getAllProducts);

router.get('/products/:id', productController.getProductById);
router.post('/products', upload.single('image'), productController.addProduct);
router.delete('/products/:id', productController.deleteProduct);
router.put('/products/:id', upload.single('image'), productController.updateProduct);
router.get('/products/search/query', productController.searchProducts);



module.exports = router;
