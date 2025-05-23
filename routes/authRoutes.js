const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { onlyPublic } = require('../middleware/authMiddleware');




router.post('/register', onlyPublic, authController.register);
router.post('/login', onlyPublic, authController.login);


module.exports = router;