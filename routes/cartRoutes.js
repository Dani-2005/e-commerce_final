const express = require('express');
const router = express.Router();
const db = require('../db/db'); // conexión a SQLite
const { onlyUser } = require('../middleware/authMiddleware');

// Ruta para guardar el carrito
router.post('/cart', onlyUser, (req, res) => {
  const userId = req.user.id;
  const products = req.body;

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }

  if (products.length === 0) {
    // Si el carrito está vacío, borra los carritos y items del usuario
    db.all(`SELECT id FROM carts WHERE user_id = ?`, [userId], function(err, carts) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al buscar carritos anteriores' });
      }
      const cartIds = carts.map(c => c.id);
      db.run(`DELETE FROM cart_items WHERE cart_id IN (${cartIds.map(() => '?').join(',') || 'NULL'})`, cartIds, function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al limpiar productos del carrito anterior' });
        }
        db.run(`DELETE FROM carts WHERE user_id = ?`, [userId], function(err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al limpiar el carrito anterior' });
          }
          return res.json({ message: 'Carrito vacío y limpiado correctamente' });
        });
      });
    });
    return;
  }

  // Primero, obtenemos los carritos anteriores del usuario
  db.all(`SELECT id FROM carts WHERE user_id = ?`, [userId], function(err, carts) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al buscar carritos anteriores' });
    }

    const cartIds = carts.map(c => c.id);

    // Eliminamos los productos de esos carritos
    db.run(`DELETE FROM cart_items WHERE cart_id IN (${cartIds.map(() => '?').join(',') || 'NULL'})`, cartIds, function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al limpiar productos del carrito anterior' });
      }

      // Eliminamos los carritos anteriores
      db.run(`DELETE FROM carts WHERE user_id = ?`, [userId], function(err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al limpiar el carrito anterior' });
        }

        // Creamos un nuevo carrito para el usuario
        db.run(`INSERT INTO carts (user_id) VALUES (?)`, [userId], function(err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al crear el carrito' });
          }

          const cartId = this.lastID; // ID del nuevo carrito

          const validProducts = products.filter(
            p => p.product_id && p.quantity
          );

          if (validProducts.length === 0) {
            return res.status(400).json({ error: 'No hay productos válidos para guardar' });
          }

          const stmt = db.prepare(
            `INSERT INTO cart_items (cart_id, product_id, quantity, price, name, image) VALUES (?, ?, ?, ?, ?, ?)`
          );

          let insertErrors = false;
          let inserted = 0;

          for (const product of validProducts) {
            stmt.run(
              cartId,
              product.product_id,
              product.quantity,
              product.price,
              product.name,
              product.image,
              function(err) {
                if (err) {
                  insertErrors = true;
                  console.error('Error insertando producto:', err, product);
                }
                inserted++;
                if (inserted === validProducts.length) {
                  stmt.finalize((err) => {
                    if (err || insertErrors) {
                      return res.status(500).json({ error: 'Error al guardar uno o más productos del carrito' });
                    }
                    res.json({ message: 'Carrito guardado correctamente' });
                  });
                }
              }
            );
          }
        });
      });
    });
  });
});


router.get ('/cart' , onlyUser, (req, res) => {
    const userId = req.user.id;

  db.all(`SELECT * FROM carts WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener el carrito' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Carrito vacío' });
    }

    res.json(rows);
  });
});

router.get('/cart/:cartId/items', onlyUser, (req, res) => {
  const cartId = req.params.cartId;

  db.all(`SELECT * FROM cart_items WHERE cart_id = ?`, [cartId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener los productos del carrito' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No hay productos en el carrito' });
    }

    res.json(rows);
  });
});


module.exports = router;
