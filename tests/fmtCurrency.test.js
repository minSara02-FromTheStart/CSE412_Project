const { fmtCurrency } = require('../js/customer-dashboard-utils');

describe('76. fmtCurrency formats numbers and handles invalid input', () => {
  test('formats number correctly', () => {
    expect(fmtCurrency(1000)).toBe('৳1,000');
  });

  test('handles invalid input', () => {
    expect(fmtCurrency('not a number')).toBe('৳0');
  });
});