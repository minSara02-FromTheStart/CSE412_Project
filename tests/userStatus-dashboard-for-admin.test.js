const { dashboardFor } = require('../js/userStatus-utils.cjs');

describe('userStatus dashboardFor admin role', () => {
  test('returns admin.html for Admin role', () => {
    expect(dashboardFor('Admin')).toBe('admin.html');
  });
});
