const jwt = require('jsonwebtoken');
const db = require('../db/db');



function onlyUser(req, res, next) {
    reviewCookies(req, res, (user) => {
        if (user) return next();
        return res.redirect('/pages/index.html');
    });
}

function onlyPublic(req, res, next) {
    reviewCookies(req, res, (user) => {
        if (!user) return next();
        return res.redirect('/pages/index.html');
    });
}

function reviewCookies(req, res, callback) {
    try {
        if (!req.headers.cookie) return callback(null);
        const cookieJWT = req.headers.cookie.split('; ').find(row => row.startsWith('jwt='));
        if (!cookieJWT) return callback(null);
        const token = cookieJWT.split('=')[1];
        const encoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = encoded.id;
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err || !row) return callback(null);
            req.user = row;
            callback(row);
        });
    } catch (e) {
        return callback(null);
    }
}

module.exports = { onlyUser, onlyPublic , reviewCookies };