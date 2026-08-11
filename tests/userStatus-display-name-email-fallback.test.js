const { displayNameFrom } = require('../js/userStatus-utils.cjs');

describe('userStatus displayNameFrom email fallback', () => {
  test('uses email local part when displayName/fullName are missing', () => {
    expect(displayNameFrom({ email: 'user@example.com' })).toBe('User');
  });
});
