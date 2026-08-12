const { orderItemsSummary } = require('../js/customer-dashboard-utils');

describe('82. orderItemsSummary returns fallback when items list is empty', () => {
  test('returns product as fallback', () => {
    const order = {
      items: [],
      product: 'Mixed Nuts'
    };

    expect(orderItemsSummary(order)).toBe('Mixed Nuts');
  });
});