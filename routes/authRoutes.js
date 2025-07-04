const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { onlyPublic } = require('../middleware/authMiddleware');
const { reviewCookies } = require('../middleware/authMiddleware');





router.post('/register', onlyPublic, authController.register);
router.post('/login', onlyPublic, authController.login);
router.get('/register', onlyPublic, authController.showRegister);
router.get('/login', onlyPublic, authController.showLogin);

router.get('/check', (req, res) => {
    reviewCookies(req, res, (user) => {
        if (user) {
            res.json({ authenticated: true, user });
        } else {
            res.json({ authenticated: false });
        }
    });
});

router.get('/auth/check-admin', (req, res) => {
    reviewCookies(req, res, (user) => {
        if (user && user.role === 'admin') {
            res.json({ authenticated: true, isAdmin: true, user });
        } else if (user) {
            res.json({ authenticated: true, isAdmin: false, user });
        } else {
            res.json({ authenticated: false, isAdmin: false });
        }
    });
});


module.exports = router;