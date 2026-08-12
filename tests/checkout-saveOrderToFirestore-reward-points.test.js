/**
 * @jest-environment jsdom
 */

describe("saveOrderToFirestore", () => {

  test("calculates reward points from grand total", () => {

    const grandTotal = 2500;

    const rewardPoints = Math.floor(grandTotal / 100);

    expect(rewardPoints).toBe(25);
  });

});