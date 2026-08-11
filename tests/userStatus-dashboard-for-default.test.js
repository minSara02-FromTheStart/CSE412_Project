const { dashboardFor } = require('../js/userStatus-utils.cjs');

describe('userStatus dashboardFor default role', () => {
  test('returns customer-dashboard.html for any other role', () => {
    expect(dashboardFor('Customer')).toBe('customer-dashboard.html');
    expect(dashboardFor('Guest')).toBe('customer-dashboard.html');
  });
});
