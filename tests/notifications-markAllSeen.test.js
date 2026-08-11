/**
 * @jest-environment jsdom
 */

describe("markAllSeen", () => {

  test("stores seen coupon IDs in localStorage", () => {

    const couponIds = ["coupon1", "coupon2", "coupon3"];

    localStorage.setItem(
      "seenCouponIds",
      JSON.stringify(couponIds)
    );

    const stored = JSON.parse(
      localStorage.getItem("seenCouponIds")
    );

    expect(stored).toEqual(couponIds);
    expect(stored).toHaveLength(3);
  });

});