module.exports = {
    getAllProducts: (req, res) => {
        const db = require('../db/db');
        db.all('SELECT * FROM products', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    },
    getProductById: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    },
    addProduct: (req, res) => {
        const db = require('../db/db');
        const { name, price, stock, category } = req.body;
        const image = req.file ? req.file.filename : null;
        db.run('INSERT INTO products (name, price, stock, category, image) VALUES (?, ?, ?, ?, ?)', [name, price, stock, category, image], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id: this.lastID });
        });
    },
    updateProduct: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        const { name, price, stock, category } = req.body;
        const image = req.file ? req.file.filename : null;
        db.run('UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image = ? WHERE id = ?', [name, price, stock, category, image, id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ updatedID: id });
        });
    },
    deleteProduct: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ deletedID: id });
        });
    }
}