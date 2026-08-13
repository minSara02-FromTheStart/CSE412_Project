describe('new-arrivals-feed.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  /*
   * Keeps the most recent item for each SKU.
   *
   * "Most recent" is determined by createdAt.
   */
  function dedupeBySKU(items) {
    if (!Array.isArray(items)) return [];

    const bySku = new Map();

    items.forEach(item => {
      if (!item || !item.sku) return;

      const existing = bySku.get(item.sku);

      if (!existing) {
        bySku.set(item.sku, item);
        return;
      }

      const currentDate = parseDate(item.createdAt);
      const existingDate = parseDate(existing.createdAt);

      if (
        currentDate &&
        (!existingDate || currentDate > existingDate)
      ) {
        bySku.set(item.sku, item);
      }
    });

    return [...bySku.values()];
  }


  /*
   * Safely converts a date value into a Date object.
   *
   * Invalid dates return null instead of throwing an error.
   */
  function parseDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value?.toDate === 'function') {
      const date = value.toDate();

      return date instanceof Date && !isNaN(date.getTime())
        ? date
        : null;
    }

    const date = new Date(value);

    return isNaN(date.getTime()) ? null : date;
  }


  /*
   * Returns only items newer than the cutoff date.
   *
   * Items with invalid dates are skipped safely.
   */
  function filterByDate(items, cutoffDate) {
    if (!Array.isArray(items)) return [];

    const cutoff = parseDate(cutoffDate);

    if (!cutoff) return [];

    return items.filter(item => {
      const createdAt = parseDate(item?.createdAt);

      if (!createdAt) return false;

      return createdAt > cutoff;
    });
  }


  /*
   * Enforces the maximum number of new-arrival items.
   */
  function limitItems(items, maxItems = 12) {
    if (!Array.isArray(items)) return [];

    return items.slice(0, maxItems);
  }


  // =========================================================
  // UNIT TEST 1
  // Dedupe keeps most recent item for duplicate SKUs
  // =========================================================

  test('Dedupe keeps the most recent item for duplicate SKUs', () => {

    const items = [
      {
        id: 'old-banana',
        sku: 'BANANA-001',
        name: 'Old Banana Chips',
        createdAt: '2026-08-10T10:00:00'
      },

      {
        id: 'new-banana',
        sku: 'BANANA-001',
        name: 'New Banana Chips',
        createdAt: '2026-08-13T10:00:00'
      },

      {
        id: 'papaya',
        sku: 'PAPAYA-001',
        name: 'Dried Papaya',
        createdAt: '2026-08-12T10:00:00'
      }
    ];

    const result = dedupeBySKU(items);

    expect(result).toHaveLength(2);

    expect(
      result.find(item => item.sku === 'BANANA-001')
    ).toEqual({
      id: 'new-banana',
      sku: 'BANANA-001',
      name: 'New Banana Chips',
      createdAt: '2026-08-13T10:00:00'
    });

    expect(
      result.find(item => item.sku === 'PAPAYA-001')
    ).toEqual({
      id: 'papaya',
      sku: 'PAPAYA-001',
      name: 'Dried Papaya',
      createdAt: '2026-08-12T10:00:00'
    });
  });


  // =========================================================
  // UNIT TEST 2
  // Date filtering returns items newer than cutoff
  // =========================================================

  test('Date filtering returns items newer than cutoff', () => {

    const cutoff = new Date('2026-08-10T00:00:00');

    const items = [
      {
        id: 'old',
        sku: 'OLD-001',
        createdAt: '2026-08-09T12:00:00'
      },

      {
        id: 'new-1',
        sku: 'NEW-001',
        createdAt: '2026-08-10T12:00:00'
      },

      {
        id: 'new-2',
        sku: 'NEW-002',
        createdAt: '2026-08-12T12:00:00'
      }
    ];

    const result = filterByDate(items, cutoff);

    expect(result).toHaveLength(2);

    expect(result.map(item => item.id)).toEqual([
      'new-1',
      'new-2'
    ]);
  });


  // =========================================================
  // UNIT TEST 3
  // Limit enforcement returns correct number of items
  // =========================================================

  test('Limit enforcement returns the correct number of items', () => {

    const items = Array.from(
      { length: 15 },
      (_, index) => ({
        id: `product-${index + 1}`,
        sku: `SKU-${index + 1}`,
        createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00`
      })
    );

    const result = limitItems(items, 12);

    expect(result).toHaveLength(12);

    expect(result[0].id).toBe('product-1');

    expect(result[11].id).toBe('product-12');

    expect(
      result.some(item => item.id === 'product-13')
    ).toBe(false);
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Invalid date formats are skipped safely
  // =========================================================

  test('Invalid date formats in items are skipped safely', () => {

    const cutoff = new Date('2026-08-10T00:00:00');

    const items = [
      {
        id: 'valid',
        sku: 'VALID-001',
        createdAt: '2026-08-12T10:00:00'
      },

      {
        id: 'invalid',
        sku: 'INVALID-001',
        createdAt: 'not-a-real-date'
      },

      {
        id: 'missing-date',
        sku: 'MISSING-001'
      }
    ];

    expect(() => {
      filterByDate(items, cutoff);
    }).not.toThrow();

    const result = filterByDate(items, cutoff);

    expect(result).toHaveLength(1);

    expect(result[0].id).toBe('valid');
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Empty source list returns an empty result
  // =========================================================

  test('Empty source list returns an empty result', () => {

    expect(
      dedupeBySKU([])
    ).toEqual([]);

    expect(
      filterByDate([], new Date('2026-08-10T00:00:00'))
    ).toEqual([]);

    expect(
      limitItems([])
    ).toEqual([]);
  });

});