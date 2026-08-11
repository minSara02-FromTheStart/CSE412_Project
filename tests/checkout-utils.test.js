/**
 * @jest-environment jsdom
 */

const {
  escapeHTML,
  formatPrice,
  isValidEmail,
  isValidPhone,
  prefillCustomer,
  getSelectedDeliveryLabel
} = require('../js/checkout-utils');

describe('checkout utility helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('escapeHTML encodes angle brackets and special characters', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('formatPrice returns Bangladeshi currency formatting', () => {
    expect(formatPrice(1234)).toBe('৳1,234');
    expect(formatPrice('5000')).toBe('৳5,000');
    expect(formatPrice(null)).toBe('৳0');
  });

  test('isValidEmail accepts a valid email and rejects invalid ones', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user@@example.com')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  test('isValidPhone accepts valid Bangladeshi formats', () => {
    expect(isValidPhone('01712345678')).toBe(true);
    expect(isValidPhone('+8801712345678')).toBe(true);
    expect(isValidPhone('8801712345678')).toBe(true);
    expect(isValidPhone('123456')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  test('prefillCustomer populates empty input fields from user data', () => {
    document.body.innerHTML = `
      <input id="fullName" value="" />
      <input id="phone" value="" />
      <input id="email" value="" />
    `;

    prefillCustomer({ displayName: 'Jane Doe', email: 'jane@example.com' }, { phone: '01711112222' });

    expect(document.getElementById('fullName').value).toBe('Jane Doe');
    expect(document.getElementById('phone').value).toBe('01711112222');
    expect(document.getElementById('email').value).toBe('jane@example.com');
  });

  test('getSelectedDeliveryLabel returns the chosen delivery option label', () => {
    document.body.innerHTML = `
      <label class="checkout-option">
        <input type="radio" name="delivery" value="0" checked />
        <strong>Standard Delivery</strong>
      </label>
      <label class="checkout-option">
        <input type="radio" name="delivery" value="60" />
        <strong>Express Delivery</strong>
      </label>
    `;

    expect(getSelectedDeliveryLabel()).toBe('Standard Delivery');

    document.querySelectorAll('input[name="delivery"]')[1].checked = true;
    expect(getSelectedDeliveryLabel()).toBe('Express Delivery');
  });
});

test('validateCoupon rejects code with only whitespace', () => {
  expect(validateCoupon('   ', 1000).valid).toBe(false);
});

test('isValidPhone rejects a phone number with letters', () => {
  expect(isValidPhone('017abc12345')).toBe(false);
});



// 2. escapeHTML returns empty string for null
test('escapeHTML returns empty string for null', () => {
  expect(escapeHTML(null)).toBe('');
});

// 4. formatPrice treats undefined as 0
test('formatPrice treats undefined as 0', () => {
  expect(formatPrice(undefined)).toBe('৳0');
});

// 32. blocks one-time coupon reuse
describe('validateCoupon — one-time coupon reuse', () => {
  const oneTimeCoupons = {
    WELCOME50: { type: 'percentage', value: 50, minOrder: 0, oneTimeOnly: true }
  };

  test('blocks one-time coupon reuse', () => {
    const result = validateCoupon('WELCOME50', 1000, {
      coupons: oneTimeCoupons,
      usedCoupons: ['WELCOME50']
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('already used');
    expect(result.message).toContain('WELCOME50');
  });

  // 33. accepts a multi-use coupon after previous use
  test('accepts a multi-use coupon after previous use', () => {
    const result = validateCoupon('SAVE15', 3000, {
      usedCoupons: ['SAVE15']
    });

    expect(result.valid).toBe(true);
    expect(result.code).toBe('SAVE15');
  });
});
