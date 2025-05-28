const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { onlyPublic } = require('../middleware/authMiddleware');




router.post('/register', onlyPublic, authController.register);
router.post('/login', onlyPublic, authController.login);
router.get('/register', onlyPublic, authController.showRegister);
router.get('/login', onlyPublic, authController.showLogin);

module.exports = router;