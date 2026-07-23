const Order = require('./Order');

class OrderBuilder {
  constructor() {
    this.orderData = {
      customer: null,
      items: [],
      totalAmount: 0,
      status: 'pending',
      deliveryAddress: ''
    };
  }

  setCustomer(customerId) {
    this.orderData.customer = customerId;
    return this;
  }

  addItem(productId, quantity, price) {
    this.orderData.items.push({ product: productId, quantity, price });
    this.orderData.totalAmount += quantity * price;
    return this;
  }

  setStatus(status) {
    this.orderData.status = status;
    return this;
  }

  setDeliveryAddress(address) {
    this.orderData.deliveryAddress = address;
    return this;
  }

  validate() {
    if (!this.orderData.customer) {
      throw new Error('Order must have a customer');
    }
    if (this.orderData.items.length === 0) {
      throw new Error('Order must have at least one item');
    }
  }

  build() {
    this.validate();
    return new Order(this.orderData);
  }
}

module.exports = OrderBuilder;