/**
 * @jest-environment jsdom
 */

describe("normaliseProduct", () => {

  test("fills defaults for missing fields", () => {

    const product = {
      id: "p101"
    };

    const normaliseProduct = (product) => {
      if (!product || !product.id) {
        return null;
      }

      return {
        id: String(product.id),
        name: product.name || "Unnamed Product",
        price: Number(product.price) || 0,
        image: product.image || ""
      };
    };

    const result = normaliseProduct(product);

    expect(result).toEqual({
      id: "p101",
      name: "Unnamed Product",
      price: 0,
      image: ""
    });
  });

});