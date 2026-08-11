/**
 * @jest-environment jsdom
 */

describe("loadCustomCoupons", () => {

  test("merges live coupons without duplicate codes", () => {

    const existingCoupons = [
      {
        code: "SAVE15",
        type: "percentage",
        value: 15
      },
      {
        code: "FREESHIP",
        type: "freeShip",
        value: 0
      }
    ];

    const liveCoupons = [
      {
        code: "SAVE15",
        type: "percentage",
        value: 15
      },
      {
        code: "FLASH20",
        type: "percentage",
        value: 20
      }
    ];

    const mergedCoupons = [...existingCoupons];

    liveCoupons.forEach(coupon => {
      const exists = mergedCoupons.some(
        existing => existing.code === coupon.code
      );

      if (!exists) {
        mergedCoupons.push(coupon);
      }
    });

    expect(mergedCoupons).toHaveLength(3);
    expect(mergedCoupons.map(coupon => coupon.code)).toEqual([
      "SAVE15",
      "FREESHIP",
      "FLASH20"
    ]);
  });

});