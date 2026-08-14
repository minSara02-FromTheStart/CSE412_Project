describe('26) userStatus.js', () => {
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

  function updateUserNavButton(buttonEl, user, userData) {
    if (!buttonEl) return;
    if (!user) {
      buttonEl.textContent = "Buy Now";
      buttonEl.href = "login.html";
      buttonEl.removeAttribute("aria-label");
      return;
    }

    const role = (userData && userData.role) || "Customer";
    const name = displayNameFrom(user, userData);

    buttonEl.textContent = `Hi, ${name}`;
    buttonEl.href = dashboardFor(role);
    buttonEl.setAttribute("aria-label", `Open ${name}'s dashboard`);
  }

  beforeEach(() => {
    document.body.innerHTML = `<a id="loginNavBtn" href="login.html">Login</a>`;
  });

  describe('Unit Tests', () => {
    test('1. Dashboard link and button text for Admin/Deliveryman render correct destination', () => {
      const btn = document.getElementById('loginNavBtn');
      const user = { uid: 'u123' };
      
      updateUserNavButton(btn, user, { fullName: 'Robert Fox', role: 'Deliveryman' });
      expect(btn.textContent).toBe('Hi, Robert');
      expect(btn.href).toContain('rider-dashboard.html');

      updateUserNavButton(btn, user, { fullName: 'Sarah Admin', role: 'Admin' });
      expect(btn.textContent).toBe('Hi, Sarah');
      expect(btn.href).toContain('admin.html');
    });

    test('2. Email fallback displayed when fullName is missing', () => {
      const btn = document.getElementById('loginNavBtn');
      const user = { uid: 'u456', email: 'alexander@domain.com' };

      updateUserNavButton(btn, user, {});
      expect(btn.textContent).toBe('Hi, Alexander');
      expect(btn.href).toContain('customer-dashboard.html');
    });
  });

  describe('Negative Tests', () => {
    test('1. Corrupted/null user sets default guest button without throwing', () => {
      const btn = document.getElementById('loginNavBtn');
      expect(() => updateUserNavButton(btn, null, null)).not.toThrow();
      expect(btn.textContent).toBe('Buy Now');
      expect(btn.href).toContain('login.html');
    });
  });
});