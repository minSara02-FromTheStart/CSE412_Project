const { dashboardFor } = require('../js/userStatus-utils.cjs');

describe('userStatus dashboardFor deliveryman role', () => {
  test('returns rider-dashboard.html for Deliveryman role', () => {
    expect(dashboardFor('Deliveryman')).toBe('rider-dashboard.html');
  });
});
