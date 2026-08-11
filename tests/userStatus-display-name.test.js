const { displayNameFrom } = require('../js/userStatus-utils.cjs');

describe('userStatus displayNameFrom', () => {
  test('returns first name from user.name', () => {
    expect(displayNameFrom({ name: 'Jane Doe' })).toBe('Jane');
  });

  test('returns Customer when no name or email is provided', () => {
    expect(displayNameFrom({})).toBe('Customer');
  });
});
