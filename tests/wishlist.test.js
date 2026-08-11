const { normaliseProduct } = require("../js/wishlist-utils");

describe("normaliseProduct", () => {
  test("returns null when product is invalid", () => {
    expect(normaliseProduct(null)).toBeNull();
  });

  test("normalizes a product and fills missing default fields", () => {
    const normalized = normaliseProduct({ id: 123, price: "200", desc: "Rich protein" });

    expect(normalized).toEqual({
      id: "123",
      productId: "123",
      name: "Product",
      price: 200,
      unit: "KG",
      image: "https://via.placeholder.com/300",
      desc: "Rich protein"
    });
  });

  test("uses description fallback when desc is missing", () => {
    const normalized = normaliseProduct({ id: 456, price: 150, description: "Fresh stock" });
    expect(normalized.desc).toBe("Fresh stock");
  });
});



test('normaliseProduct returns null when product is an empty object', () => {
  expect(normaliseProduct({})).toBeNull();
});