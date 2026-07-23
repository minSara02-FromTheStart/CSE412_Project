const Product = require('./Product');

class ProductBuilder {
  constructor() {
    this.productData = {
      name: '',
      price: 0,
      description: '',
      image: '',
      category: '',
      stock: 0
    };
  }

  setName(name) {
    this.productData.name = name;
    return this;
  }

  setPrice(price) {
    this.productData.price = price;
    return this;
  }

  setDescription(description) {
    this.productData.description = description;
    return this;
  }

  setImage(image) {
    this.productData.image = image;
    return this;
  }

  setCategory(category) {
    this.productData.category = category;
    return this;
  }

  setStock(stock) {
    this.productData.stock = stock;
    return this;
  }

  validate() {
    if (!this.productData.name) {
      throw new Error('Product name is required');
    }
    if (this.productData.price === undefined || this.productData.price === null) {
      throw new Error('Product price is required');
    }
  }

  build() {
    this.validate();
    return new Product(this.productData);
  }
}

module.exports = ProductBuilder;