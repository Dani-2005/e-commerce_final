const db = require('../db/db');

module.exports = {
    // Get all products
  getAllProducts: (req, res) => {
    const categoryId = req.query.category_id;
    const subcategoryId = req.query.subcategory_id;

    let query = `
      SELECT p.*
           , c.name AS category_name
           , s.name AS subcategory_name
      FROM products p
      LEFT JOIN products_category c ON p.category_id = c.category_id
      LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
    `;

    const params = [];
    const conditions = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (subcategoryId) {
      conditions.push('p.subcategory_id = ?');
      params.push(subcategoryId);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    db.all(query, params, (err, products) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (products.length === 0) {
        res.json([]);
        return;
      }

      // Obtener tallas y stock para todos los productos
      const productIds = products.map(p => p.product_id);
      const placeholders = productIds.map(() => '?').join(', ');

      const sizesQuery = `
        SELECT ps_rel.product_id, ps.size_id, ps.name, ps_rel.stock
        FROM product_sizes ps_rel
        JOIN product_size ps ON ps_rel.size_id = ps.size_id
        WHERE ps_rel.product_id IN (${placeholders})
      `;

      db.all(sizesQuery, productIds, (err, sizes) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Agrupar tallas por producto_id
        const sizesByProduct = {};
        sizes.forEach(({ product_id, size_id, name, stock }) => {
          if (!sizesByProduct[product_id]) {
            sizesByProduct[product_id] = [];
          }
          sizesByProduct[product_id].push({ id: size_id, name, stock });
        });

        // Añadir tallas a cada producto
        const productsWithSizes = products.map(product => ({
          ...product,
          sizes: sizesByProduct[product.product_id] || []
        }));

        res.json(productsWithSizes);
      });
    });
  },

  // Get product by ID
  getProductById: (req, res) => {
    const id = req.params.id;
    const query = `
      SELECT 
          p.*, 
          c.name AS category_name, 
          s.name AS subcategory_name
      FROM products p
      LEFT JOIN products_category c ON p.category_id = c.category_id
      LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
      WHERE p.product_id = ?
    `;

    db.get(query, [id], (err, product) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!product) {
        res.status(404).json({ error: 'Producto no encontrado' });
        return;
      }

      const sizesQuery = `
        SELECT ps.size_id, ps.name, ps_rel.stock
        FROM product_sizes ps_rel
        JOIN product_size ps ON ps_rel.size_id = ps.size_id
        WHERE ps_rel.product_id = ?
      `;

      db.all(sizesQuery, [id], (err, sizes) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        product.sizes = sizes.map(({ size_id, name, stock }) => ({
          id: size_id,
          name,
          stock
        }));
        res.json(product);
      });
    });
  },

    // Get products by ID la modificacion es para tener stock por prodictos
    getProductById: (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT 
            p.*, 
            c.name AS category_name, 
            s.name AS subcategory_name
        FROM products p
        LEFT JOIN products_category c ON p.category_id = c.category_id
        LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
        WHERE p.product_id = ?
    `;

    db.get(query, [id], (err, product) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!product) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        const sizesQuery = `
          SELECT ps.size_id, ps.name, ps_rel.stock
          FROM product_sizes ps_rel
          JOIN product_size ps ON ps_rel.size_id = ps.size_id
          WHERE ps_rel.product_id = ?
        `;


        db.all(sizesQuery, [id], (err, sizes) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            product.sizes = sizes; // arreglo con { size_name, stock }
            res.json(product);
        });
    });
},




    addProduct: (req, res) => {
    const { name, price, category_id, subcategory_id, discount } = req.body;
    const image = req.file ? req.file.filename : null;

    // Parsear sizes si viene como string (por ejemplo, desde FormData)
    let sizes = [];
    if (req.body.sizes) {
        try {
            sizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
        } catch (e) {
            return res.status(400).json({ error: 'Formato inválido para sizes' });
        }
    }

    // Validar y normalizar descuento
    let discountValue = 0;
    if (discount !== undefined && discount !== null && discount !== "") {
        discountValue = parseInt(discount, 10);
        if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
            return res.status(400).json({ error: 'El descuento debe ser un número entre 0 y 100' });
        }
    }

    const query = `
        INSERT INTO products (name, price, category_id, subcategory_id, image, discount)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [name, price, category_id, subcategory_id, image, discountValue], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const product_id = this.lastID;

        if (Array.isArray(sizes) && sizes.length > 0) {
            const placeholders = sizes.map(() => '(?, ?, ?)').join(', ');
            const params = [];
            sizes.forEach(({ size_id, stock }) => {
                params.push(product_id, size_id, stock);
            });

            db.run(`INSERT INTO product_sizes (product_id, size_id, stock) VALUES ${placeholders}`, params, function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.status(201).json({ id: product_id, message: 'Producto creado con tallas y stock' });
            });
        } else {
            res.status(201).json({ id: product_id, message: 'Producto creado sin tallas' });
        }
    });
},



    // Update product
updateProduct: (req, res) => {
  const product_id = req.params.id;
  const { name, price, category_id, subcategory_id, discount } = req.body;
  const image = req.file ? req.file.filename : null;

  let sizes = [];
  if (req.body.sizes) {
    try {
      sizes = JSON.parse(req.body.sizes);
      console.log('Tallas parseadas:', sizes);
    } catch (e) {
      console.error('Error al parsear sizes:', e);
      console.error('La cadena que causó el error fue:', req.body.sizes); 
      return res.status(400).json({ error: 'Formato inválido para sizes' });
    }
  } else {
    console.log('No se recibió campo sizes');
  }

  // Validación y normalización del descuento
  let discountValue = 0;
  if (discount !== undefined && discount !== null && discount !== "") {
    discountValue = parseInt(discount, 10);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return res.status(400).json({ error: 'El descuento debe ser un número entre 0 y 100' });
    }
  }

  let query, params;
  if (image) {
    query = `
      UPDATE products 
      SET name = ?, price = ?, category_id = ?, subcategory_id = ?, image = ?, discount = ?
      WHERE product_id = ?
    `;
    params = [name, price, category_id, subcategory_id, image, discountValue, product_id];
  } else {
    query = `
      UPDATE products 
      SET name = ?, price = ?, category_id = ?, subcategory_id = ?, discount = ?
      WHERE product_id = ?
    `;
    params = [name, price, category_id, subcategory_id, discountValue, product_id];
  }

  db.run(query, params, function (err) {
    if (err) {
      console.error('Error update products:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Producto actualizado correctamente');

    db.run(`DELETE FROM product_sizes WHERE product_id = ?`, [product_id], function (err) {
      if (err) {
        console.error('Error DELETE product_sizes:', err);
        return res.status(500).json({ error: err.message });
      }

      if (Array.isArray(sizes) && sizes.length > 0) {
        const placeholders = sizes.map(() => '(?, ?, ?)').join(', ');
        const paramsSizes = [];
        sizes.forEach(({ size_id, stock }) => {
          paramsSizes.push(product_id, size_id, stock);
        });

        db.run(`INSERT INTO product_sizes (product_id, size_id, stock) VALUES ${placeholders}`, paramsSizes, function (err) {
          if (err) {
            console.error('Error INSERT product_sizes:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log('Tallas con stock insertadas correctamente');
          res.json({ message: 'Producto y tallas con stock actualizados' });
        });
      } else {
        console.log('No hay tallas para insertar');
        res.json({ message: 'Producto actualizado sin tallas asignadas' });
      }
    });
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
    },

    searchProducts: (req, res) => {
    const searchTerm = (req.query.query || '').trim();
    if (!searchTerm) {
        return res.status(400).json({ error: 'Falta el término de búsqueda' });
    }

    const sql = `
        SELECT DISTINCT p.product_id
        FROM products p
        LEFT JOIN products_category c ON p.category_id = c.category_id
        LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
        LEFT JOIN product_sizes ps_rel ON p.product_id = ps_rel.product_id
        LEFT JOIN product_size ps ON ps_rel.size_id = ps.size_id
        WHERE LOWER(p.name) LIKE LOWER(?)
           OR LOWER(c.name) LIKE LOWER(?)
           OR LOWER(s.name) LIKE LOWER(?)
           OR LOWER(ps.name) LIKE LOWER(?)`;
    const params = [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`
    ];

    db.all(sql, params, (err, productRows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (productRows.length === 0) {
            return res.json([]);
        }

        // Obtener los productos completos
        const productIds = productRows.map(row => row.product_id);
        const placeholders = productIds.map(() => '?').join(', ');

        const productsQuery = `
            SELECT p.*, c.name AS category_name, s.name AS subcategory_name
            FROM products p
            LEFT JOIN products_category c ON p.category_id = c.category_id
            LEFT JOIN products_subcategory s ON p.subcategory_id = s.subcategory_id
            WHERE p.product_id IN (${placeholders})
        `;

        db.all(productsQuery, productIds, (err, products) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Obtener tallas y stock para los productos encontrados
            const sizesQuery = `
                SELECT ps_rel.product_id, ps.size_id, ps.name, ps_rel.stock
                FROM product_sizes ps_rel
                JOIN product_size ps ON ps_rel.size_id = ps.size_id
                WHERE ps_rel.product_id IN (${placeholders})
            `;

            db.all(sizesQuery, productIds, (err, sizes) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Agrupar tallas por producto_id
                const sizesByProduct = {};
                sizes.forEach(({ product_id, size_id, name, stock }) => {
                    if (!sizesByProduct[product_id]) {
                        sizesByProduct[product_id] = [];
                    }
                    sizesByProduct[product_id].push({ id: size_id, name, stock });
                });

                // Añadir tallas a cada producto
                const productsWithSizes = products.map(product => ({
                    ...product,
                    sizes: sizesByProduct[product.product_id] || []
                }));

                res.json(productsWithSizes);
            });
        });
    });
  }
};
