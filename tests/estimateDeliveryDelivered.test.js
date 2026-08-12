const { estimateDelivery } = require('../js/customer-dashboard-utils');

describe('80. estimateDelivery returns Delivered for Delivered status', () => {
  test('returns Delivered', () => {
    const order = {
      status: 'Delivered'
    };

    expect(estimateDelivery(order)).toBe('Delivered');
  });
});