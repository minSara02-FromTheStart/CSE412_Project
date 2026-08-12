const { fmtDate } = require('../js/customer-dashboard-utils');

describe('79. fmtDate returns - for invalid value', () => {
  test('returns dash for invalid value', () => {
    expect(fmtDate('garbage')).toBe('-');
  });
});