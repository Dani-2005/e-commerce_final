// Order.js
class Order {
  constructor(userId, cartId, total) {
    this.userId = userId;
    this.cartId = cartId;
    this.total = total;
    this.createdAt = new Date();
    this.status = 'pending'; // Estado inicial del pedido
    this.items = [];
  }

}

export default Order;

