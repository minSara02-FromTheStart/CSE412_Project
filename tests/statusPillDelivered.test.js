const { statusPillClass } = require('../js/customer-dashboard-utils');

describe('84. statusPillClass returns delivered class for Delivered', () => {
  test('returns delivered class', () => {
    expect(statusPillClass('Delivered'))
      .toBe('pill pill-delivered');
  });
});