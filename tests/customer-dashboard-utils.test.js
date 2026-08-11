const {
  TIERS, escapeHTML, getTier, fmtCurrency, toDate, fmtDate,
  estimateDelivery, orderItemsSummary, statusPillClass, getInitials,
  orderPoints, safePhoneHref
} = require('../js/customer-dashboard-utils');

describe('escapeHTML', () => {
  test('escapes HTML special characters', () => {
    expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('returns empty string for null', () => {
    expect(escapeHTML(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(escapeHTML(undefined)).toBe('');
  });

  test('converts numbers to string', () => {
    expect(escapeHTML(123)).toBe('123');
  });
});

describe('getTier', () => {
  test('0 points is Bronze, next is Silver', () => {
    const { current, next } = getTier(0);
    expect(current.name).toBe('Bronze');
    expect(next.name).toBe('Silver');
  });

  test('49 points is still Bronze', () => {
    expect(getTier(49).current.name).toBe('Bronze');
  });

  test('exactly 50 points is Silver', () => {
    expect(getTier(50).current.name).toBe('Silver');
  });

  test('150 points is Gold, next is Platinum', () => {
    const { current, next } = getTier(150);
    expect(current.name).toBe('Gold');
    expect(next.name).toBe('Platinum');
  });

  test('300+ points is Platinum with no next tier', () => {
    const { current, next } = getTier(500);
    expect(current.name).toBe('Platinum');
    expect(next).toBeNull();
  });
});

describe('fmtCurrency', () => {
  test('formats a number with currency symbol', () => {
    expect(fmtCurrency(1000)).toBe('\u09F31,000');
  });

  test('treats undefined as 0', () => {
    expect(fmtCurrency(undefined)).toBe('\u09F30');
  });

  test('treats NaN as 0', () => {
    expect(fmtCurrency('not a number')).toBe('\u09F30');
  });
});

describe('toDate', () => {
  test('returns null for falsy input', () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate(0)).toBeNull();
  });

  test('calls .toDate() for Firestore Timestamp-like objects', () => {
    const fakeDate = new Date('2026-01-01');
    const fakeTimestamp = { toDate: () => fakeDate };
    expect(toDate(fakeTimestamp)).toBe(fakeDate);
  });

  test('parses a valid date string', () => {
    const result = toDate('2026-01-01');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
  });

  test('returns null for an invalid date string', () => {
    expect(toDate('not a date')).toBeNull();
  });
});

describe('fmtDate', () => {
  test('returns "-" for null/invalid timestamp', () => {
    expect(fmtDate(null)).toBe('-');
    expect(fmtDate('garbage')).toBe('-');
  });

  test('formats a valid date', () => {
    expect(fmtDate('2026-01-15')).toMatch(/15 Jan 2026/);
  });
});

describe('estimateDelivery', () => {
  test('returns "Delivered" when status is Delivered', () => {
    expect(estimateDelivery({ status: 'Delivered' })).toBe('Delivered');
  });

  test('returns "Arriving soon" when status is Out for Delivery', () => {
    expect(estimateDelivery({ status: 'Out for Delivery' })).toBe('Arriving soon');
  });

  test('returns "Expected today" for instant delivery type', () => {
    expect(estimateDelivery({ status: 'Pending', deliveryType: 'Instant Delivery' })).toBe('Expected today');
  });

  test('returns pickup message for pickup delivery type', () => {
    expect(estimateDelivery({ status: 'Pending', deliveryType: 'Store Pickup' })).toBe('Ready at pickup point');
  });

  test('returns a date range for standard delivery', () => {
    const result = estimateDelivery({ status: 'Pending', deliveryType: 'Standard', createdAt: '2026-01-01' });
    expect(result).toMatch(/^Expected .+ - .+$/);
  });
});

describe('orderItemsSummary', () => {
  test('joins multiple items with quantities', () => {
    const order = { items: [{ name: 'Almonds', qty: 2 }, { name: 'Cashews', qty: 1 }] };
    expect(orderItemsSummary(order)).toBe('Almonds x 2, Cashews x 1');
  });

  test('defaults quantity to 1 when qty is missing', () => {
    const order = { items: [{ name: 'Almonds' }] };
    expect(orderItemsSummary(order)).toBe('Almonds x 1');
  });

  test('falls back to order.product when items array is empty', () => {
    expect(orderItemsSummary({ items: [], product: 'Mixed Nuts' })).toBe('Mixed Nuts');
  });

  test('falls back to "-" when neither items nor product exist', () => {
    expect(orderItemsSummary({})).toBe('-');
  });
});

describe('statusPillClass', () => {
  test('returns correct class for Delivered', () => {
    expect(statusPillClass('Delivered')).toBe('pill pill-delivered');
  });

  test('returns correct class for Out for Delivery', () => {
    expect(statusPillClass('Out for Delivery')).toBe('pill pill-outfordelivery');
  });

  test('returns correct class for Processing', () => {
    expect(statusPillClass('Processing')).toBe('pill pill-processing');
  });

  test('returns pending class for unknown/missing status', () => {
    expect(statusPillClass('SomethingElse')).toBe('pill pill-pending');
    expect(statusPillClass(undefined)).toBe('pill pill-pending');
  });
});

describe('getInitials', () => {
  test('returns first letters of first two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  test('handles single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  test('defaults to "C" when name is missing', () => {
    expect(getInitials(undefined)).toBe('C');
    expect(getInitials('')).toBe('C');
  });

  test('only uses first two words for a long name', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('orderPoints', () => {
  test('uses pointsEarned when it is a finite number', () => {
    expect(orderPoints({ pointsEarned: 25 })).toBe(25);
  });

  test('falls back to grandTotal / 1500 when pointsEarned is missing', () => {
    expect(orderPoints({ grandTotal: 3000 })).toBe(2);
  });

  test('falls back to total / 1500 when grandTotal is missing', () => {
    expect(orderPoints({ total: 1500 })).toBe(1);
  });

  test('returns 0 when neither pointsEarned nor totals exist', () => {
    expect(orderPoints({})).toBe(0);
  });
});

describe('safePhoneHref', () => {
  test('formats a clean phone number', () => {
    expect(safePhoneHref('+8801712345678')).toBe('tel:+8801712345678');
  });

  test('strips spaces and dashes', () => {
    expect(safePhoneHref('017-123 45678')).toBe('tel:01712345678');
  });

  test('handles missing phone', () => {
    expect(safePhoneHref(undefined)).toBe('tel:');
  });
});