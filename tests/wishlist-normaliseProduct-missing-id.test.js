/**
 * @jest-environment jsdom
 */

describe("normaliseProduct", () => {

  test("returns null for missing id", () => {

    const product = {
      name: "Almonds",
      price: 500,
      image: "almonds.jpg"
    };

    const normaliseProduct = (product) => {
      if (!product || !product.id) {
        return null;
      }

      return {
        id: String(product.id),
        name: product.name,
        price: Number(product.price),
        image: product.image
      };
    };

    expect(normaliseProduct(product)).toBeNull();
  });

});