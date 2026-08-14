describe('23.b) script.js — Authentication & Form Handling', () => {
  function validateSignupData({ name, phone, email, password }) {
    if (!name || !phone || !email || !password) {
      return { valid: false, error: 'Please fill all fields.' };
    }
    if (!/^01\d{9}$/.test(phone)) {
      return { valid: false, error: 'Phone number must start with 01 and be 11 digits.' };
    }
    return { valid: true };
  }

  function registerUser(usersStore, userData) {
    const email = userData.email.trim().toLowerCase();
    if (usersStore[email]) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    usersStore[email] = { ...userData, email };
    return { success: true, users: usersStore };
  }

  describe('Unit Tests', () => {
    test('1. Valid BD phone number (01XXXXXXXXX) passes registration validation', () => {
      const result = validateSignupData({
        name: 'Rahim Ahmed',
        phone: '01712345678',
        email: 'rahim@test.com',
        password: 'securePassword123'
      });
      expect(result.valid).toBe(true);
    });

    test('2. Case-insensitive email normalization on account creation', () => {
      const store = {};
      const result = registerUser(store, {
        name: 'Karim',
        email: 'KaRiM@EXAMPLE.com',
        phone: '01812345678',
        password: 'pass'
      });

      expect(result.success).toBe(true);
      expect(store['karim@example.com']).toBeDefined();
    });

    test('3. Scroll calculation shows search box only past hero boundary', () => {
      const heroSection = { offsetTop: 0, offsetHeight: 500 };
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      const isVisible = (scrollY) => scrollY > (heroBottom - 80);

      expect(isVisible(400)).toBe(false);
      expect(isVisible(421)).toBe(true);
      expect(isVisible(600)).toBe(true);
    });
  });

  describe('Negative Tests', () => {
    test('1. Phone number with invalid prefix or length fails validation', () => {
      expect(validateSignupData({ name: 'A', phone: '02123456789', email: 'a@a.com', password: '1' }).valid).toBe(false);
      expect(validateSignupData({ name: 'A', phone: '017123456', email: 'a@a.com', password: '1' }).valid).toBe(false);
      expect(validateSignupData({ name: 'A', phone: '0171234567890', email: 'a@a.com', password: '1' }).valid).toBe(false);
    });

    test('2. Duplicate user registration is rejected', () => {
      const store = { 'user@test.com': { name: 'Existing' } };
      const result = registerUser(store, {
        name: 'New',
        email: 'user@test.com',
        phone: '01700000000',
        password: 'pwd'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });
});