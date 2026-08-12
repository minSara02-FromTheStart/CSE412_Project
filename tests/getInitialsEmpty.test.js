const { getInitials } = require('../js/customer-dashboard-utils');

describe('87. getInitials returns C for empty input', () => {
  test('returns C for empty string', () => {
    expect(getInitials('')).toBe('C');
  });

  test('returns C for undefined', () => {
    expect(getInitials(undefined)).toBe('C');
  });
});