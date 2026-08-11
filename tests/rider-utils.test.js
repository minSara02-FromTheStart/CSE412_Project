const {
  getInitials,
  fmtCurrency,
  orderItemsSummary
} = require("../js/rider-utils.js");

describe("getInitials", () => {
  test("returns initials for two-word name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  test("returns R for empty name", () => {
    expect(getInitials("")).toBe("R");
  });
});

describe("fmtCurrency", () => {
  test("formats currency", () => {
    expect(fmtCurrency(1200)).toBe("৳1,200");
  });

  test("returns ৳0 for invalid input", () => {
    expect(fmtCurrency("abc")).toBe("৳0");
  });
});

describe("orderItemsSummary", () => {
  test("formats order items", () => {
    const order = {
      items: [
        { name: "Rice", qty: 2 },
        { name: "Milk", qty: 1 }
      ]
    };

    expect(orderItemsSummary(order)).toBe("Rice ×2, Milk ×1");
  });

  test("returns product name when no items array exists", () => {
    expect(orderItemsSummary({ product: "Bread" })).toBe("Bread");
  });
});