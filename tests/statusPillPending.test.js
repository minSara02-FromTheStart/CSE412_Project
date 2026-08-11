const { statusPillClass } = require('../js/customer-dashboard-utils');

describe('85. statusPillClass returns pending class for unknown statuses', () => {
  test('returns pending class', () => {
    expect(statusPillClass('Unknown'))
      .toBe('pill pill-pending');
  });
});