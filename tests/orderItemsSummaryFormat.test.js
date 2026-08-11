const { orderItemsSummary } = require('../js/customer-dashboard-utils');

describe('83. orderItemsSummary formats item names and quantities', () => {
  test('formats multiple items', () => {
    const order = {
      items: [
        { name: 'Almonds', qty: 2 },
        { name: 'Cashews', qty: 1 }
      ]
    };

    expect(orderItemsSummary(order))
      .toBe('Almonds x 2, Cashews x 1');
  });
});