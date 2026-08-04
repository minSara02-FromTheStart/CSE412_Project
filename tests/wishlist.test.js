const { normaliseProduct } = require("../js/wishlist-utils");

describe("normaliseProduct", () => {
  test("returns null when product is invalid", () => {
    expect(normaliseProduct(null)).toBeNull();
  });
});