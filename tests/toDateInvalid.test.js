const { toDate } = require('../js/customer-dashboard-utils');

describe('78. toDate returns null for invalid date strings', () => {
  test('returns null for invalid date', () => {
    expect(toDate('not a date')).toBeNull();
  });
});