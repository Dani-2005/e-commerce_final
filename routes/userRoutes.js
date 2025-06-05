const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.addUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/profile', userController.addprofile);
router.get('/users/profiles', userController.getProfileAll);
router.get('/users/profiles/:userId', userController.getProfileByUserId);




module.exports = router;