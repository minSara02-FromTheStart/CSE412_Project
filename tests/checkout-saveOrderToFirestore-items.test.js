/**
 * @jest-environment jsdom
 */

describe("saveOrderToFirestore", () => {

  test("builds the order item array correctly", () => {

    const cart = [
      {
        id: "p1",
        name: "Almonds",
        price: 500,
        quantity: 2
      },
      {
        id: "p2",
        name: "Oats",
        price: 300,
        quantity: 1
      }
    ];

    const orderItems = cart.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    expect(orderItems).toEqual([
      {
        productId: "p1",
        name: "Almonds",
        price: 500,
        quantity: 2
      },
      {
        productId: "p2",
        name: "Oats",
        price: 300,
        quantity: 1
      }
    ]);
  });

});