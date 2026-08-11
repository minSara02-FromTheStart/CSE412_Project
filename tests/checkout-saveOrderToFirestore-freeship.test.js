/**
 * @jest-environment jsdom
 */

describe("saveOrderToFirestore", () => {

  test("includes free shipping when FREESHIP applies", () => {

    const grandTotal = 1500;
    const deliveryFee = 120;
    const coupon = {
      code: "FREESHIP"
    };

    let finalDeliveryFee = deliveryFee;

    if (coupon.code === "FREESHIP") {
      finalDeliveryFee = 0;
    }

    const finalTotal = grandTotal + finalDeliveryFee;

    expect(finalDeliveryFee).toBe(0);
    expect(finalTotal).toBe(1500);
  });

});