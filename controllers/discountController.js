const db = require('../db/db');

module.exports = {

getMostSoldProducts : (req, res) => {
  const query = `
    SELECT 
     oi.product_id,
     p.name,
     p.price,
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
      return res.status(500).json({ error: 'Error al obtener los productos más vendidos' });
    }
    res.json(products);
  });
},

getDiscountedProducts : (req, res) => {
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
      discount DESC
    LIMIT 10;
  `;

  db.all(query, [], (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los productos en descuento' });
    }
    res.json(products);
  });
}
}