
class Product {
  constructor(id, name, price, stock, category, subcategory, image ) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.subcategory = subcategory;
    this.image = image;
  }
}

module.exports = {Product};
