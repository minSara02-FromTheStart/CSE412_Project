const { estimateDelivery } = require('../js/customer-dashboard-utils');

describe('81. estimateDelivery returns pickup message for pickup type', () => {
  test('returns pickup message', () => {
    const order = {
      status: 'Pending',
      deliveryType: 'Store Pickup'
    };

    expect(estimateDelivery(order)).toBe('Ready at pickup point');
  });
});