const db = require('../db/db');

module.exports = {
    // Get all products
    getAllProducts: (req, res) => {
  const categoryId = req.query.category_id;

  let query = `
    SELECT p.*, c.name AS category_name, s.name AS subcategory_name
    FROM products p
    LEFT JOIN products_category c ON p.category_id = c.category_id
    LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
  `;

  const params = [];

  if (categoryId) {
    query += ' WHERE p.category_id = ?';
    params.push(categoryId);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
},


    // Get products by ID
    getProductById: (req, res) => {;
        const id = req.params.id;
        const query = `
            SELECT p.*, c.name AS category_name, s.name AS subcategory_name
            FROM products p
            LEFT JOIN products_category c ON p.category_id = c.category_id
            LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
            WHERE p.product_id = ?
        `;
        db.get(query, [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    },


    addProduct: (req, res) => {
        const { name, price, stock, category_id, subcategory_id } = req.body;
        const image = req.file ? req.file.filename : null;
        const query = `
            INSERT INTO products (name, price, stock, category_id, subcategory_id, image)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [name, price, stock, category_id, subcategory_id, image], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id: this.lastID });
        });
    },

    // Update product
    updateProduct: (req, res) => {
    const id = req.params.id;
    const { name, price, stock, category_id, subcategory_id } = req.body;
    const image = req.file ? req.file.filename : null;

    let query, params;

    if (image) {
        query = `
            UPDATE products SET name = ?, price = ?, stock = ?, category_id = ?, subcategory_id = ?, image = ?
            WHERE product_id = ?
        `;
        params = [name, price, stock, category_id, subcategory_id, image, id];
    } else {
        query = `
            UPDATE products SET name = ?, price = ?, stock = ?, category_id = ?, subcategory_id = ?
            WHERE product_id = ?
        `;
        params = [name, price, stock, category_id, subcategory_id, id];
    }

    db.run(query, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Producto actualizado' });
    });
},

    updateStock: (productId, quantity, callback) => {
    const query = `
        UPDATE products
        SET stock = stock - ?
        WHERE product_id = ? AND stock >= ?
    `;
    db.run(query, [quantity, productId, quantity], function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, this.changes);
    });
},
    updateStockAsync: (productId, quantity) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE products
            SET stock = stock - ?
            WHERE product_id = ? AND stock >= ?
        `;
        db.run(query, [quantity, productId, quantity], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
},


    // Delete product
    deleteProduct: (req, res) => {
        const id = req.params.id;
        db.run('DELETE FROM products WHERE product_id = ?', [id], function(err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ deletedID: id });
        });
    }
};