/**
 * @jest-environment node
 */

const OrderBuilder = require('../server/models/OrderBuilder');
const Order = require('../server/models/Order');

// Valid-looking 24-character hex strings so Mongoose can cast them to ObjectId
const CUSTOMER_ID = '507f1f77bcf86cd799439011';
const PRODUCT_ID_1 = '507f1f77bcf86cd799439012';
const PRODUCT_ID_2 = '507f1f77bcf86cd799439013';

describe('OrderBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new OrderBuilder();
  });

  test('setCustomer sets the customer id', () => {
    builder.setCustomer(CUSTOMER_ID);
    expect(builder.orderData.customer).toBe(CUSTOMER_ID);
  });

  test('addItem pushes an item into items array', () => {
    builder.addItem(PRODUCT_ID_1, 2, 50);
    expect(builder.orderData.items).toHaveLength(1);
    expect(builder.orderData.items[0]).toEqual({
      product: PRODUCT_ID_1,
      quantity: 2,
      price: 50
    });
  });

  test('addItem correctly accumulates totalAmount for a single item', () => {
    builder.addItem(PRODUCT_ID_1, 3, 100);
    expect(builder.orderData.totalAmount).toBe(300);
  });

  test('addItem correctly accumulates totalAmount across multiple items', () => {
    builder
      .addItem(PRODUCT_ID_1, 2, 50)   // 100
      .addItem(PRODUCT_ID_2, 1, 200); // 200
    expect(builder.orderData.totalAmount).toBe(300);
    expect(builder.orderData.items).toHaveLength(2);
  });

  test('setStatus updates the status', () => {
    builder.setStatus('confirmed');
    expect(builder.orderData.status).toBe('confirmed');
  });

  test('setDeliveryAddress updates the delivery address', () => {
    builder.setDeliveryAddress('123 Main St');
    expect(builder.orderData.deliveryAddress).toBe('123 Main St');
  });

  test('methods are chainable', () => {
    const result = builder
      .setCustomer(CUSTOMER_ID)
      .addItem(PRODUCT_ID_1, 1, 10)
      .setStatus('confirmed')
      .setDeliveryAddress('123 Main St');
    expect(result).toBe(builder);
  });

  test('validate throws if customer is missing', () => {
    builder.addItem(PRODUCT_ID_1, 1, 10);
    expect(() => builder.validate()).toThrow('Order must have a customer');
  });

  test('validate throws if items array is empty', () => {
    builder.setCustomer(CUSTOMER_ID);
    expect(() => builder.validate()).toThrow('Order must have at least one item');
  });

  test('validate does not throw when customer and items are present', () => {
    builder.setCustomer(CUSTOMER_ID).addItem(PRODUCT_ID_1, 1, 10);
    expect(() => builder.validate()).not.toThrow();
  });

  test('build returns an Order instance with correct data', () => {
    const order = builder
      .setCustomer(CUSTOMER_ID)
      .addItem(PRODUCT_ID_1, 2, 50)
      .setStatus('confirmed')
      .setDeliveryAddress('123 Main St')
      .build();

    expect(order).toBeInstanceOf(Order);
    expect(order.customer.toString()).toBe(CUSTOMER_ID);
    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBe(100);
    expect(order.status).toBe('confirmed');
    expect(order.deliveryAddress).toBe('123 Main St');
  });

  test('build throws if validation fails (no customer)', () => {
    builder.addItem(PRODUCT_ID_1, 1, 10);
    expect(() => builder.build()).toThrow('Order must have a customer');
  });

  test('build throws if validation fails (no items)', () => {
    builder.setCustomer(CUSTOMER_ID);
    expect(() => builder.build()).toThrow('Order must have at least one item');
  });
});