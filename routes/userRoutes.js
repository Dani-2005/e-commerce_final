const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const { onlyUser } = require('../middleware/authMiddleware');

//aplica solo usuarios a estas rutas
router.use('/users/profile', onlyUser);
router.use('/users/profiles', onlyUser);

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.addUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.post('/users/profile', userController.addprofile);
router.get('/users/profiles/all', userController.getProfileAll);
router.get('/users/profiles/:user_id', userController.getProfileByUserId);
router.get('/users/profile/:profile_id', userController.getProfileByprofile_id);
router.put('/users/profile/:profile_id', userController.updateProfile);
router.delete('/users/profile/:profile_id', userController.deleteProfile);
router.delete('/users/profiles/:user_id', userController.deleteProfile);
router.put('/users/profiles/:user_id', userController.deleteProfile);




module.exports = router;