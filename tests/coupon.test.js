/**
 * @jest-environment jsdom
 */

const {
  couponSummary,
  mapLiveCoupon,
  getCouponList,
  builtInCoupons,
  copyCode,
  mergeCoupons
} = require("../js/coupon");

describe("coupon.js", () => {

  // =========================================================
  // UNIT TESTS
  // =========================================================

  test("couponSummary returns free shipping message for freeShip coupon", () => {

    const coupon = {
      type: "freeShip"
    };

    expect(couponSummary(coupon))
      .toBe("Free shipping on this order.");
  });


  test("couponSummary returns percentage discount message", () => {

    const coupon = {
      type: "percentage",
      value: 15
    };

    expect(couponSummary(coupon))
      .toBe("Get 15% off.");
  });


  test("mapLiveCoupon creates the correct coupon display data", () => {

    const coupon = {
      code: "SAVE20",
      title: "20% Off",
      description: "Save on your order.",
      value: 20,
      minOrder: 1000,
      oneTimeOnly: false
    };

    expect(mapLiveCoupon(coupon)).toEqual({
      code: "SAVE20",
      badge: "Min Order ৳1000",
      title: "20% Off",
      desc: "Save on your order. Get 20% off."
    });
  });


  test("getCouponList includes the built-in coupons", () => {

    const result = getCouponList();

    expect(result).toEqual(builtInCoupons);
    expect(result.length).toBe(builtInCoupons.length);
  });


  test("mergeCoupons combines built-in and live coupons", () => {

    const builtIn = [
      {
        code: "FIRST10",
        title: "10% Off"
      }
    ];

    const live = [
      {
        code: "LIVE20",
        title: "20% Off",
        value: 20,
        minOrder: 0,
        oneTimeOnly: false
      }
    ];

    const result = mergeCoupons(builtIn, live);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(builtIn[0]);
    expect(result[1]).toEqual({
      code: "LIVE20",
      badge: "Limited Time",
      title: "20% Off",
      desc: "Get 20% off."
    });
  });


  test("copyCode copies the coupon code and changes button text", async () => {

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue()
      }
    });

    const button = document.createElement("button");
    button.textContent = "Copy";

    copyCode("SAVE20", button);

    await Promise.resolve();

    expect(navigator.clipboard.writeText)
      .toHaveBeenCalledWith("SAVE20");

    expect(button.textContent)
      .toBe("Copied!");
  });


  // =========================================================
  // NEGATIVE TESTS
  // =========================================================

  test("couponSummary returns empty string when coupon has no discount value", () => {

    const coupon = {
      type: "percentage"
    };

    expect(couponSummary(coupon)).toBe("");
  });


  test("mapLiveCoupon handles missing title and description", () => {

    const coupon = {
      code: "TEST10",
      value: 10,
      minOrder: 0,
      oneTimeOnly: false
    };

    expect(mapLiveCoupon(coupon)).toEqual({
      code: "TEST10",
      badge: "Limited Time",
      title: "TEST10",
      desc: "Get 10% off."
    });
  });


  test("couponSummary returns empty string for an unknown coupon type", () => {

    const coupon = {
      type: "unknown",
      value: 0
    };

    expect(couponSummary(coupon)).toBe("");
  });


  test("mergeCoupons handles empty live coupon list", () => {

    const builtIn = [
      {
        code: "FIRST10"
      }
    ];

    const result = mergeCoupons(builtIn, []);

    expect(result).toEqual(builtIn);
  });


  test("copyCode falls back to alert when clipboard fails", async () => {

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockRejectedValue(new Error("Clipboard failed"))
      }
    });

    window.alert = jest.fn();

    const button = document.createElement("button");
    button.textContent = "Copy";

    copyCode("BADCODE", button);

    await Promise.resolve();

    expect(window.alert)
      .toHaveBeenCalledWith("Coupon code: BADCODE");
  });

});