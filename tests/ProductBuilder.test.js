/**
 * @jest-environment node
 */

// Mock the Product model since server/models/Product.js doesn't exist yet.
// { virtual: true } tells Jest not to require the file to actually exist on disk.
// This keeps ProductBuilder's tests isolated from whatever Product ends up being
// (Mongoose model, Firestore doc, etc.) - true unit testing.
jest.mock('../server/models/Product', () => {
  return jest.fn().mockImplementation((data) => ({ ...data }));
}, { virtual: true });

const ProductBuilder = require('../server/models/ProductBuilder');
const Product = require('../server/models/Product');

describe('ProductBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new ProductBuilder();
    Product.mockClear();
  });

  test('setName sets the product name', () => {
    builder.setName('Laptop');
    expect(builder.productData.name).toBe('Laptop');
  });

  test('setPrice sets the product price', () => {
    builder.setPrice(999.99);
    expect(builder.productData.price).toBe(999.99);
  });

  test('setDescription sets the product description', () => {
    builder.setDescription('A great laptop');
    expect(builder.productData.description).toBe('A great laptop');
  });

  test('setImage sets the product image', () => {
    builder.setImage('laptop.jpg');
    expect(builder.productData.image).toBe('laptop.jpg');
  });

  test('setCategory sets the product category', () => {
    builder.setCategory('Electronics');
    expect(builder.productData.category).toBe('Electronics');
  });

  test('setStock sets the product stock', () => {
    builder.setStock(25);
    expect(builder.productData.stock).toBe(25);
  });

  test('methods are chainable', () => {
    const result = builder
      .setName('Laptop')
      .setPrice(999.99)
      .setDescription('A great laptop')
      .setImage('laptop.jpg')
      .setCategory('Electronics')
      .setStock(25);
    expect(result).toBe(builder);
  });

  test('validate throws if name is missing', () => {
    builder.setPrice(100);
    expect(() => builder.validate()).toThrow('Product name is required');
  });

  test('validate throws if price is undefined', () => {
    builder.setName('Laptop');
    builder.productData.price = undefined;
    expect(() => builder.validate()).toThrow('Product price is required');
  });

  test('validate throws if price is null', () => {
    builder.setName('Laptop');
    builder.productData.price = null;
    expect(() => builder.validate()).toThrow('Product price is required');
  });

  test('validate does not throw when price is 0 (edge case)', () => {
    builder.setName('Free Sample').setPrice(0);
    expect(() => builder.validate()).not.toThrow();
  });

  test('validate does not throw when name and price are present', () => {
    builder.setName('Laptop').setPrice(999.99);
    expect(() => builder.validate()).not.toThrow();
  });

  test('build calls Product constructor with correct data', () => {
    builder
      .setName('Laptop')
      .setPrice(999.99)
      .setDescription('A great laptop')
      .setImage('laptop.jpg')
      .setCategory('Electronics')
      .setStock(25)
      .build();

    expect(Product).toHaveBeenCalledTimes(1);
    expect(Product).toHaveBeenCalledWith({
      name: 'Laptop',
      price: 999.99,
      description: 'A great laptop',
      image: 'laptop.jpg',
      category: 'Electronics',
      stock: 25
    });
  });

  test('build returns the constructed product object', () => {
    const product = builder.setName('Laptop').setPrice(999.99).build();
    expect(product.name).toBe('Laptop');
    expect(product.price).toBe(999.99);
  });

  test('build throws if validation fails (no name)', () => {
    builder.setPrice(100);
    expect(() => builder.build()).toThrow('Product name is required');
    expect(Product).not.toHaveBeenCalled();
  });
});