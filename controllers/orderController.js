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
  const userId = req.user?.id;
  const { metodo_pago, direccion } = req.body;

  if (!orderId || !userId || !metodo_pago || !direccion) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Error de conexión a la base de datos' });
  }

  try {
    // Verificar que la orden pertenece al usuario y no esté pagada
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (order.status === 'completed' || order.status === 'pagado') {
      return res.status(400).json({ error: 'La orden ya ha sido pagada' });
    }

    // Obtener los ítems de la orden, incluyendo size_id
    const items = await new Promise((resolve, reject) => {
      db.all('SELECT product_id, quantity, price, name, size_id FROM order_items WHERE order_id = ?', [orderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Descontar stock por talla
    for (const item of items) {
      if (!item.size_id) {
        return res.status(400).json({ error: `No se encontró talla para el producto ${item.name}` });
      }

      // Verificar stock actual
      const stockRow = await new Promise((resolve, reject) => {
        db.get(
          'SELECT stock FROM product_sizes WHERE product_id = ? AND size_id = ?',
          [item.product_id, item.size_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!stockRow || stockRow.stock < item.quantity) {
        return res.status(400).json({ error: `No hay suficiente stock para el producto ${item.name} en la talla seleccionada` });
      }

      // Actualizar stock
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size_id = ?',
          [item.quantity, item.product_id, item.size_id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Calcular total (por seguridad, recalcular en backend)
    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    // Actualizar la orden con método de pago, dirección y estado
await new Promise((resolve, reject) => {
  db.run(
    `UPDATE orders SET 
      status = ?, 
      metodo_pago = ?, 
      direccion = ?, 
      total = ?
    WHERE id = ?`,
    [
      'completed',
      metodo_pago,
      JSON.stringify(direccion),  // Guardar la dirección completa como JSON string
      total,
      orderId
    ],
    function(err) {
      if (err) reject(err);
      else resolve();
    }
  );
});



    res.status(200).json({ message: 'Orden pagada, stock actualizado y datos guardados correctamente' });

  } catch (err) {
    console.error("Error en payOrder:", err);
    res.status(500).json({ error: err.message });
  }
};


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






