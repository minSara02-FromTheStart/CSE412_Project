const { getInitials } = require('../js/customer-dashboard-utils');

describe('86. getInitials returns uppercase initials from name', () => {
  test('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});