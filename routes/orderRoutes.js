const express = require('express');
const router = express.Router();
const db = require('../db/db'); // conexión a SQLite
const { onlyUser } = require('../middleware/authMiddleware');

// Ruta para crear una orden
router.post('/orders', onlyUser, (req, res) => {
  const userId = req.user.id;

  // Buscar el carrito activo (no finalizado)
  db.get('SELECT * FROM carts WHERE user_id = ? AND checked_out = 0', [userId], (err, cart) => {
    console.log('Carrito encontrado:', cart);
    if (err) return res.status(500).json({ error: 'Error al buscar el carrito' });
    if (!cart) return res.status(400).json({ error: 'No hay carrito activo' });

    // Obtener los ítems del carrito
    db.all('SELECT * FROM cart_items WHERE cart_id = ?', [cart.id], (err, items) => {
      console.log('Carrito encontrado:', cart);
      if (err) return res.status(500).json({ error: 'Error al obtener ítems del carrito' });
      if (!items || items.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

      // Calcular el total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Crear la orden
      db.run('INSERT INTO orders (user_id, cart_id, total) VALUES (?, ?, ?)', [userId, cart.id, total], function(err) {
        if (err) return res.status(500).json({ error: 'Error al crear la orden' });

        const orderId = this.lastID;

        // Marcar el carrito como finalizado
        db.run('UPDATE carts SET checked_out = 1 WHERE id = ?', [cart.id]);

        // Insertar ítems de la orden
        const stmt = db.prepare(
          'INSERT INTO order_items (order_id, product_id, quantity, price, name, image) VALUES (?, ?, ?, ?, ?, ?)'
        );
        let inserted = 0;
        let hasError = false;

        for (const item of items) {
          stmt.run(orderId, item.product_id, item.quantity, item.price, item.name, item.image, function(err) {
            if (err) hasError = true;
            inserted++;
            if (inserted === items.length) {
              stmt.finalize((err) => {
                if (err || hasError) return res.status(500).json({ error: 'Error al guardar ítems de la orden' });

                // Marcar el carrito como finalizado
                db.run('UPDATE carts SET checked_out = 1 WHERE id = ?', [cart.id], (err) => {
                  if (err) return res.status(500).json({ error: 'Error al actualizar el carrito' });
                  res.json({ message: 'Orden creada con éxito', orderId });
                });
              });
            }
          });
        }
      });
    });
  });
});

router.get('/orders', onlyUser, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Error al obtener las órdenes' });
    res.json(orders);
  });
});


router.get('/orders/:orderId', onlyUser, (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) return res.status(500).json({ error: 'Error al obtener la orden' });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    db.all('SELECT * FROM order_items WHERE order_id = ?', [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: 'Error al obtener los ítems de la orden' });
      order.items = items;
      res.json(order);
    });
  });
});

router.delete('/orders/:orderId', onlyUser, (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  db.run('DELETE FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar la orden' });
    if (this.changes === 0) return res.status(404).json({ error: 'Orden no encontrada' });

    db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar los ítems de la orden' });
      res.json({ message: 'Orden eliminada con éxito' });
    });
  });
});


module.exports = router;