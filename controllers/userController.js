module.exports = { 
    getAllUsers: (req, res) => {
        const db = require('../db/db');
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    },
    getUserById: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    },
    addUser: (req, res) => {
        const db = require('../db/db');
        const { username, password, email } = req.body;
        db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id: this.lastID });
        });
    },
    updateUser: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        const { username, password, email } = req.body;
        db.run('UPDATE users SET username = ?, password = ?, email = ? WHERE id = ?', [username, password, email, id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ updatedID: id });
        });
    },
    deleteUser: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ deletedID: id });
        });
    },
    addprofile: (req, res) => {
        const db = require('../db/db');
        const { user_id, first_name, last_name, address, department, city, state, postal_code, phone } = req.body;
        db.run('INSERT INTO user_profiles (user_id, first_name, last_name, address, department, city, state, postal_code, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [user_id, first_name, last_name, address, department, city, state, postal_code, phone], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ profileID: this.lastID });
        });
    },
    getProfileByUserId: (req, res) => {
        const db = require('../db/db');
        const user_id = req.params.user_id;
        db.get('SELECT * FROM user_profiles WHERE user_id = ?', [user_id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    }}

