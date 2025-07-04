const db = require('../db/db');


// Crear una orden
exports.createOrder = (req, res) => {
  console.log('BODY RECIBIDO EN ORDEN:', req.body);
  const userId = req.user.id;
  const products = req.body.products;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No hay productos para la orden' });
  }

  db.get('SELECT * FROM carts WHERE user_id = ? AND checked_out = 0', [userId], (err, cart) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el carrito' });
    if (!cart) return res.status(400).json({ error: 'No hay carrito activo' });

    // Calcula el total usando los productos recibidos (con descuento)
    const total = products.reduce((sum, item) => {
      const discount = item.discount || 0;
      const priceWithDiscount = discount > 0 ? item.price * (1 - discount / 100) : item.price;
      return sum + priceWithDiscount * item.quantity;
    }, 0);

    db.run('INSERT INTO orders (user_id, cart_id, total) VALUES (?, ?, ?)', [userId, cart.id, total], function(err) {
      if (err) return res.status(500).json({ error: 'Error al crear la orden' });

      const orderId = this.lastID;

      // Insertar ítems de la orden, incluyendo size_id y discount
      const stmt = db.prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, price, name, image, size_id, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      let inserted = 0;
      let hasError = false;

      for (const item of products) {
        stmt.run(
          orderId,
          item.product_id,
          item.quantity,
          item.price,
          item.name,
          item.image,
          item.size_id || null,
          item.discount || 0,
          function(err) {
            if (err) hasError = true;
            inserted++;
            if (inserted === products.length) {
              stmt.finalize((err) => {
                if (err || hasError) return res.status(500).json({ error: 'Error al guardar ítems de la orden' });

                // Marcar el carrito como finalizado
                db.run('UPDATE carts SET checked_out = 1 WHERE id = ?', [cart.id], (err) => {
                  if (err) return res.status(500).json({ error: 'Error al actualizar el carrito' });
                  res.json({ message: 'Orden creada con éxito', orderId });
                });
              });
            }
          }
        );
      }
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

exports.getOrderItems = (req, res) => {
  const orderId = req.params.orderId;
  db.all(
    `SELECT id, order_id, product_id, quantity, name, price, image, size_id, discount
     FROM order_items
     WHERE order_id = ?`,
    [orderId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al obtener los productos de la orden' });
      }
      res.json(rows);
    }
  );
};

// Eliminar una orden (puedes cambiar esto para solo actualizar el estado si lo deseas)
exports.deleteOrder = (req, res) => {
  const orderId = req.params.orderId;

  db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], function(err) {
    if (err) return res.status(500).json({ error: 'Error al borrar los ítems de la orden' });

    db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
      if (err) return res.status(500).json({ error: 'Error al borrar la orden' });
      if (this.changes === 0) return res.status(404).json({ error: 'Orden no encontrada' });
      res.json({ message: 'Orden borrada con éxito' });
    });
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


// Historial de órdenes del usuario
exports.getOrderHistory = (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM orders WHERE user_id = ? AND estado = ? ORDER BY created_at DESC', [userId, 'pagado'], (err, orders) => {
    if (err) return res.status(500).json({ error: 'Error al obtener el historial de órdenes' });
    res.json(orders);
  });
};

exports.payOrder = (req, res) => {
  try {
    // LOGS para depuración
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);
    console.log('orderId:', req.params.orderId);

    const orderId = req.params.orderId;
    const metodo_pago = req.body.metodo_pago;
    const direccion = req.body.direccion; // Puede ser stringificado, verifica si necesitas JSON.parse
    const total = req.body.total;

    // Campos de pago móvil
    const telefono_pago_movil = req.body.telefono_pago_movil || null;
    const referencia_pago_movil = req.body.referencia_pago_movil || null;
    const captura = req.file ? req.file.path : null;

    // Validación de campos obligatorios para pago móvil
    if (
      (metodo_pago === 'pago_movil' || metodo_pago === 'efectivo_pago_movil') &&
      (!telefono_pago_movil || !referencia_pago_movil || !captura)
    ) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para Pago Móvil' });
    }

    // Prepara la consulta SQL y los valores
    const sql = `
      UPDATE orders SET
        metodo_pago = ?,
        direccion = ?,
        total = ?,
        telefono_pago_movil = ?,
        referencia_pago_movil = ?,
        captura_pago_movil = ?,
        status = ?
      WHERE id = ?
    `;

    const values = [
      metodo_pago,
      direccion,
      total,
      telefono_pago_movil,
      referencia_pago_movil,
      captura,
      // Cambia el estado según tu flujo
      (metodo_pago === 'pago_movil' || metodo_pago === 'efectivo_pago_movil') ? 'esperando confirmación' : 'completed',
      orderId
    ];

    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error al actualizar la orden:', err);
        return res.status(500).json({ error: 'Error al actualizar la orden' });
      }
      res.json({ ok: true, message: 'Orden actualizada correctamente' });
    });

  } catch (err) {
    console.error('Error en payOrder:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingOrders = (req, res) => {
   db.all(
        `SELECT * FROM orders WHERE status = 'pendiente' OR status = 'esperando confirmación';`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};

exports.confirmOrderPayment = (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  // Verificar si la orden existe y es del usuario
  db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, order) => {
    if (err) return res.status(500).json({ error: 'Error al obtener la orden' });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status !== 'esperando confirmación') {
      return res.status(400).json({ error: 'La orden no está en estado de espera de confirmación' });
    }
    // Actualizar el estado de la orden a 'pagado'
    db.run('UPDATE orders SET status = ? WHERE id = ?', ['pagado', orderId], function(err) {
      if (err) return res.status(500).json({ error: 'Error al confirmar el pago de la orden' });
      if (this.changes === 0) return res.status(404).json({ error: 'Orden no encontrada' });
      res.json({ message: 'Pago de la orden confirmado con éxito' });
    });
  });
}

exports.getFacturaOrden = (req, res) => {
  const orderId = req.params.orderId;

  const sql = `
    SELECT o.id, o.total, o.created_at, o.status, o.direccion, o.metodo_pago,
           u.username, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;

  db.get(sql, [orderId], (err, order) => {
    if (err) {
      console.error('Error obteniendo la orden:', err);
      return res.status(500).json({ error: 'Error obteniendo la orden' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (order.status === 'pendiente') {
      return res.status(400).json({ error: 'La orden aún está pendiente, no hay factura disponible' });
    }

    // Parsear la dirección que está guardada como JSON string
    let direccion = {};
    try {
      direccion = JSON.parse(order.direccion);
    } catch {
      direccion = { info: order.direccion };
    }

    // Puedes devolver también los ítems de la orden si quieres
    const sqlItems = `
      SELECT product_id, quantity, price, name
      FROM order_items
      WHERE order_id = ?
    `;
    db.all(sqlItems, [orderId], (err, items) => {
      if (err) {
        console.error('Error obteniendo los ítems de la orden:', err);
        return res.status(500).json({ error: 'Error obteniendo los ítems de la orden' });
      }

      res.json({
        order: {
          id: order.id,
          total: order.total,
          created_at: order.created_at,
          status: order.status,
          metodo_pago: order.metodo_pago,
          direccion,
          user: {
            username: order.username,
            email: order.email
          },
          items
        }
      });
    });
  });
};






