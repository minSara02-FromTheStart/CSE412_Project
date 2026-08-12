/**
 * @jest-environment jsdom
 */

describe("normaliseProduct", () => {

  test("returns normalized output for valid input", () => {

    const product = {
      id: "p101",
      name: "Almonds",
      price: 500,
      image: "almonds.jpg"
    };

    const normalised = {
      id: String(product.id),
      name: product.name,
      price: Number(product.price),
      image: product.image
    };

    expect(normalised).toEqual({
      id: "p101",
      name: "Almonds",
      price: 500,
      image: "almonds.jpg"
    });
  });

});