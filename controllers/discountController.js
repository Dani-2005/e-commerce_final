const db = require('../db/db');

module.exports = {

  // Productos más vendidos de la semana actual
  getMostSoldProducts: (req, res) => {
    const query = `
      SELECT 
        oi.product_id,
        p.name,
        p.price,
        p.discount,
        p.image,
        SUM(oi.quantity) AS total_vendidos
      FROM 
        order_items oi
      JOIN 
        orders o ON oi.order_id = o.id
      JOIN 
        products p ON oi.product_id = p.product_id
      WHERE 
        o.status = 'completed'
        AND strftime('%W', o.created_at) = strftime('%W', 'now')
        AND strftime('%Y', o.created_at) = strftime('%Y', 'now')
      GROUP BY 
        oi.product_id
      ORDER BY 
        total_vendidos DESC
      LIMIT 10;
    `;

    db.all(query, [], (err, products) => {
      if (err) {
        console.error('Error al obtener los productos más vendidos:', err);
        return res.status(500).json({ error: 'Error al obtener los productos más vendidos' });
      }
      if (!products || products.length === 0) {
        return res.status(200).json([]); // Devuelve array vacío si no hay resultados
      }
      // Calcula el precio final con descuento si aplica
      const productsWithFinalPrice = products.map(prod => ({
        ...prod,
        price_final: prod.discount ? (prod.price * (1 - prod.discount / 100)).toFixed(2) : prod.price
      }));
      res.json(productsWithFinalPrice);
    });
  },

  // Productos con descuento, ordenados por mayor descuento
  getDiscountedProducts: (req, res) => {
    const query = `
      SELECT 
        product_id, 
        name, 
        price, 
        discount, 
        image
      FROM 
        products
      WHERE 
        discount > 0
      ORDER BY 
        discount DESC, price ASC
      LIMIT 10;
    `;

    db.all(query, [], (err, products) => {
      if (err) {
        console.error('Error al obtener los productos en descuento:', err);
        return res.status(500).json({ error: 'Error al obtener los productos en descuento' });
      }
      if (!products || products.length === 0) {
        return res.status(200).json([]);
      }
      // Calcula el precio final con descuento si aplica
      const productsWithFinalPrice = products.map(prod => ({
        ...prod,
        price_final: prod.discount ? (prod.price * (1 - prod.discount / 100)).toFixed(2) : prod.price
      }));
      res.json(productsWithFinalPrice);
    });
  },

  // Aplicar descuento grupal a productos por categoría y/o subcategoría
  applyGroupDiscount: (req, res) => {
    const { category_id, subcategory_id, discount } = req.body;

    // Validación básica
    if (discount === undefined || discount < 0 || discount > 100) {
      return res.status(400).json({ error: 'Descuento inválido' });
    }

    let query = 'UPDATE products SET discount = ? WHERE 1=1';
    const params = [discount];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }
    if (subcategory_id) {
      query += ' AND subcategory_id = ?';
      params.push(subcategory_id);
    }

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error al aplicar descuento grupal:', err);
        return res.status(500).json({ error: 'Error al aplicar descuento grupal' });
      }
      res.json({ message: `Descuento aplicado a ${this.changes} productos` });
    });
  },
  apliDiscount: (req, res) => {
    const { product_id, discount } = req.body;

    // Validación básica
    if (discount === undefined || discount < 0 || discount > 100) {
      return res.status(400).json({ error: 'Descuento inválido' });
    }

    const query = 'UPDATE products SET discount = ? WHERE product_id = ?';
    db.run(query, [discount, product_id], function(err) {
      if (err) {
        console.error('Error al aplicar descuento:', err);
        return res.status(500).json({ error: 'Error al aplicar descuento' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({ message: `Descuento de ${discount}% aplicado al producto con ID ${product_id}` });
    });
  }
};

