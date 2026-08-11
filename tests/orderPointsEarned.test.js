const { orderPoints } = require('../js/customer-dashboard-utils');

describe('88. orderPoints returns pointsEarned when present', () => {
  test('returns pointsEarned', () => {
    const order = {
      pointsEarned: 25
    };

    expect(orderPoints(order)).toBe(25);
  });
});