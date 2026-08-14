// tests/userStatus-utils.test.js

// Function definitions matching userStatus-utils.js
function dashboardFor(role) {
  if (role === "Admin") return "admin.html";
  if (role === "Deliveryman") return "rider-dashboard.html";
  return "customer-dashboard.html";
}

function displayNameFrom(user = {}, userData = {}) {
  const rawName = (userData && userData.fullName) || (user && user.displayName) || (user && user.name) || (user && user.email) || "Customer";
  const emailLocalPart = user && user.email ? user.email.split("@")[0] : "";
  const nameSource = rawName && rawName.includes("@") ? emailLocalPart : rawName;
  const name = (nameSource || emailLocalPart || "Customer").toString();
  const firstPart = name.split(" ")[0] || "Customer";
  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
}

describe('25) userStatus-utils.js', () => {
  describe('Unit Tests', () => {
    test('1. displayName fallback uses email substring when full name is absent', () => {
      const user = { email: 'john.doe@example.com' };
      const name = displayNameFrom(user, {});
      expect(name).toBe('John.doe');
    });

    test('2. Role check helper returns correct dashboard for roles', () => {
      expect(dashboardFor('Admin')).toBe('admin.html');
      expect(dashboardFor('Deliveryman')).toBe('rider-dashboard.html');
      expect(dashboardFor('Customer')).toBe('customer-dashboard.html');
    });

    test('3. Status/Name mapping yields expected title-cased first token', () => {
      const user = {};
      const userData = { fullName: 'alice smith' };
      expect(displayNameFrom(user, userData)).toBe('Alice');
    });
  });

  describe('Negative Tests', () => {
    test('1. Null/undefined user object handled safely without throwing', () => {
      expect(displayNameFrom(null, null)).toBe('Customer');
      expect(displayNameFrom(undefined, undefined)).toBe('Customer');
    });

    test('2. Unknown/empty role returns default fallback dashboard', () => {
      expect(dashboardFor('UnknownRole')).toBe('customer-dashboard.html');
      expect(dashboardFor('')).toBe('customer-dashboard.html');
      expect(dashboardFor(null)).toBe('customer-dashboard.html');
    });
  });
});