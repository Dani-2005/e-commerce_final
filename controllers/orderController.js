const db = require('../db/db');
const productController = require('./productController');

// Crear una orden
exports.createOrder = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM carts WHERE user_id = ? AND checked_out = 0', [userId], (err, cart) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el carrito' });
    if (!cart) return res.status(400).json({ error: 'No hay carrito activo' });

    db.all('SELECT * FROM cart_items WHERE cart_id = ?', [cart.id], (err, items) => {
      if (err) return res.status(500).json({ error: 'Error al obtener ítems del carrito' });
      if (!items || items.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      db.run('INSERT INTO orders (user_id, cart_id, total) VALUES (?, ?, ?)', [userId, cart.id, total], function(err) {
        if (err) return res.status(500).json({ error: 'Error al crear la orden' });

        const orderId = this.lastID;

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
};

// Obtener todas las órdenes del usuario
exports.getOrders = (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Error al obtener las órdenes' });
    res.json(orders);
  });
};

// Obtener una orden por ID
exports.getOrderById = (req, res) => {
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
};

// Eliminar una orden (puedes cambiar esto para solo actualizar el estado si lo deseas)
exports.deleteOrder = (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  db.run('UPDATE orders SET estado = ? WHERE id = ? AND user_id = ?', ['pagado', orderId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Error al actualizar el estado de la orden' });
    if (this.changes === 0) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ message: 'Orden pagada con éxito' });
  });
};

// Historial de órdenes del usuario
exports.getOrderHistory = (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM orders WHERE user_id = ? AND estado = ? ORDER BY created_at DESC', [userId, 'pagado'], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Error al obtener el historial de órdenes' });
    res.json(orders);
  });
};

exports.payOrder = async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  if (!orderId || !userId) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }
  if (!db) {
    return res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }

  try {
    // 1. Busca los ítems de la orden
    const items = await new Promise((resolve, reject) => {
      db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 2. Actualiza el stock de cada producto secuencialmente
    for (const item of items) {
      const updated = await productController.updateStockAsync(item.product_id, item.quantity);
      if (updated === 0) {
        return res.status(400).json({ error: `No hay suficiente stock para el producto ${item.product_id}` });
      }
    }

    // 3. Actualiza el estado de la orden
    await new Promise((resolve, reject) => {
      db.run('UPDATE orders SET status = ? WHERE id = ?', ['completed', orderId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(200).json({ message: 'Orden pagada y stock actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

