const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function register(req, res) {
    const { username, password, email } = req.body;
    const db = require('../db/db');

    // Verificar si el usuario o email ya existen
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            res.status(400).json({ message: 'Username or email already exists' });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(200).json({ success: true, redirect: '/pages/index.html' });

        });
    });
}

async function login(req, res) {
    const { username, password } = req.body;
    const db = require('../db/db');

    if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }

        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }

        const token = jwt.sign({ user_id: row.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ success: true, user_id: row.id, token, redirect: '/pages/index.html' });
    });
}

// controllers/authController.js

const showRegister = (req, res) => {
    res.render('register'); // Renderiza la vista "register.ejs"
};

const showLogin = (req, res) => {
    res.render('login'); // Renderiza la vista "login.ejs"
};


module.exports = {
    register,
    login,
    showRegister,
    showLogin
};