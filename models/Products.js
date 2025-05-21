
class Product {
  constructor(id, name, price, stock, image) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.image = image;
  }
}

// Carrito.js
class Cart {
  constructor(userId) {
    this.items = [];
    this.userId = userId;
  }

  addProduct(productId, stock) {
    // Lógica para añadir al carrito
  }
}

module.exports = {Product, Cart};
