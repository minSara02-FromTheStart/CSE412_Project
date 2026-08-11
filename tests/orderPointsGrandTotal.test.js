const { orderPoints } = require('../js/customer-dashboard-utils');

describe('89. orderPoints derives points from grandTotal otherwise', () => {
  test('calculates points from grandTotal', () => {
    const order = {
      grandTotal: 3000
    };

    expect(orderPoints(order)).toBe(2);
  });
});