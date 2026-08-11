

const { couponSummary, mapLiveCoupon, getCouponList, builtInCoupons } = require('../js/coupon');
// ^ adjust the path above to wherever coupon.js actually lives (e.g. '../coupon' or '../public/coupon')

describe('couponSummary', () => {
  test('returns free shipping message when type is freeShip', () => {
    expect(couponSummary({ type: 'freeShip' })).toBe('Free shipping on this order.');
  });

  test('returns percentage-off message when value is present', () => {
    expect(couponSummary({ value: 20 })).toBe('Get 20% off.');
  });

  test('freeShip takes priority even if value is also present', () => {
    expect(couponSummary({ type: 'freeShip', value: 20 })).toBe('Free shipping on this order.');
  });

  test('returns empty string when neither type nor value is present', () => {
    expect(couponSummary({})).toBe('');
  });
});

describe('mapLiveCoupon', () => {
  test('badge is "One-Time Use" when oneTimeOnly is true', () => {
    const result = mapLiveCoupon({ code: 'ABC', oneTimeOnly: true });
    expect(result.badge).toBe('One-Time Use');
  });

  test('badge shows min order when minOrder > 0 and not oneTimeOnly', () => {
    const result = mapLiveCoupon({ code: 'ABC', minOrder: 500 });
    expect(result.badge).toBe('Min Order ৳500');
  });

  test('badge falls back to "Limited Time" when no oneTimeOnly or minOrder', () => {
    const result = mapLiveCoupon({ code: 'ABC' });
    expect(result.badge).toBe('Limited Time');
  });

  test('oneTimeOnly takes priority over minOrder for badge', () => {
    const result = mapLiveCoupon({ code: 'ABC', oneTimeOnly: true, minOrder: 500 });
    expect(result.badge).toBe('One-Time Use');
  });

  test('title falls back to code when no title given', () => {
    const result = mapLiveCoupon({ code: 'SUMMER25' });
    expect(result.title).toBe('SUMMER25');
  });

  test('title uses given title when present', () => {
    const result = mapLiveCoupon({ code: 'SUMMER25', title: 'Summer Sale' });
    expect(result.title).toBe('Summer Sale');
  });

  test('desc combines description and coupon summary', () => {
    const result = mapLiveCoupon({ code: 'ABC', description: 'Limited stock.', value: 10 });
    expect(result.desc).toBe('Limited stock. Get 10% off.');
  });

  test('desc omits missing description (no leading space/undefined)', () => {
    const result = mapLiveCoupon({ code: 'ABC', value: 10 });
    expect(result.desc).toBe('Get 10% off.');
  });

  test('desc omits missing summary when no type/value', () => {
    const result = mapLiveCoupon({ code: 'ABC', description: 'Limited stock.' });
    expect(result.desc).toBe('Limited stock.');
  });

  test('code is passed through unchanged', () => {
    const result = mapLiveCoupon({ code: 'XYZ123' });
    expect(result.code).toBe('XYZ123');
  });
});

describe('getCouponList', () => {
  test('returns all built-in coupons when no live coupons exist', () => {
    const list = getCouponList();
    expect(list).toHaveLength(builtInCoupons.length);
    expect(list.map(c => c.code)).toEqual(
      expect.arrayContaining(['FIRST10', 'SAVE15', 'FLASH20', 'FREESHIP'])
    );
  });

  test('every built-in coupon has the required display fields', () => {
    const list = getCouponList();
    list.forEach(coupon => {
      expect(coupon).toHaveProperty('code');
      expect(coupon).toHaveProperty('badge');
      expect(coupon).toHaveProperty('title');
      expect(coupon).toHaveProperty('desc');
    });
  });
});



//  getCouponList includes built-in coupons plus live coupon mappings
describe('mergeCoupons', () => {
  test('combines built-in coupons with mapped live coupons, no duplicates lost', () => {
    const built = [{ code: 'FIRST10', badge: 'x', title: 'x', desc: 'x' }];
    const live = [{ code: 'SUMMER25', value: 25, minOrder: 0 }];
    const merged = mergeCoupons(built, live);

    expect(merged).toHaveLength(2);
    expect(merged.map(c => c.code)).toEqual(expect.arrayContaining(['FIRST10', 'SUMMER25']));
  });
});

describe('copyCode', () => {
  let btn;

  beforeEach(() => {
    document.body.innerHTML = `<button>Copy</button>`;
    btn = document.querySelector('button');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 14. copyCode uses clipboard API when available
  test('uses clipboard API when available and shows "Copied!"', async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    copyCode('FIRST10', btn);
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('FIRST10');
    expect(btn.textContent).toBe('Copied!');
    expect(btn.classList.contains('copied')).toBe(true);
  });

  // 15. copyCode falls back to alert when clipboard write fails
  test('falls back to alert when clipboard write fails', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    window.alert = jest.fn();

    copyCode('SAVE15', btn);
    await Promise.resolve();
    await Promise.resolve();

    expect(window.alert).toHaveBeenCalledWith('Coupon code: SAVE15');
  });
});


//  copyCode uses clipboard API when available
  test('uses clipboard API when available and shows "Copied!"', async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    copyCode('FIRST10', btn);
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('FIRST10');
    expect(btn.textContent).toBe('Copied!');
    expect(btn.classList.contains('copied')).toBe(true);
  });



  //  copyCode falls back to alert when clipboard write fails
  test('falls back to alert when clipboard write fails', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    window.alert = jest.fn();

    copyCode('SAVE15', btn);
    await Promise.resolve();
    await Promise.resolve();

    expect(window.alert).toHaveBeenCalledWith('Coupon code: SAVE15');
  });
});


//  couponSummary returns free shipping text for freeShip
test('returns free shipping message when type is freeShip', () => {
  expect(couponSummary({ type: 'freeShip' })).toBe('Free shipping on this order.');
});

