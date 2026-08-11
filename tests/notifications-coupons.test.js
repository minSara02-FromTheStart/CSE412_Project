/**
 * @jest-environment jsdom
 */

describe("watchCoupons", () => {

  test("updates coupon state and notifies observers", () => {

    let couponState = [];
    const observer = jest.fn();

    const watchCoupons = (coupons) => {
      couponState = coupons;
      observer(couponState);
    };

    const coupons = [
      {
        code: "SAVE15",
        value: 15
      },
      {
        code: "FLASH20",
        value: 20
      }
    ];

    watchCoupons(coupons);

    expect(couponState).toEqual(coupons);
    expect(observer).toHaveBeenCalledWith(coupons);
  });

});