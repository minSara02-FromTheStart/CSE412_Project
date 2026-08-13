describe('flashsale-feed.js', () => {

  // ---------------------------------------------------------
  // Helper functions copied from the logic of flashsale-feed.js
  // ---------------------------------------------------------

  function toDate(value) {
    if (!value) return null;

    if (typeof value.toDate === 'function') {
      return value.toDate();
    }

    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
  }


  function parseFeedItems(items) {
    if (!Array.isArray(items)) return [];

    return items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      flashSaleStart: item.flashSaleStart,
      flashSaleEnd: item.flashSaleEnd,
      discount: item.discount
    }));
  }


  function validateFeedItems(items) {
    if (!Array.isArray(items)) return [];

    return items.filter(item =>
      item &&
      item.price !== undefined &&
      item.price !== null &&
      item.flashSaleStart &&
      item.flashSaleEnd
    );
  }


  function isStillRunning(product) {
    const end = toDate(product.flashSaleEnd);

    if (!end) return true;

    return end.getTime() > Date.now();
  }


  function sortByStartEndDates(items) {
    if (!Array.isArray(items)) return [];

    return [...items].sort((a, b) => {
      const startA =
        toDate(a.flashSaleStart)?.getTime() ?? Infinity;

      const startB =
        toDate(b.flashSaleStart)?.getTime() ?? Infinity;

      if (startA !== startB) {
        return startA - startB;
      }

      const endA =
        toDate(a.flashSaleEnd)?.getTime() ?? Infinity;

      const endB =
        toDate(b.flashSaleEnd)?.getTime() ?? Infinity;

      return endA - endB;
    });
  }


  // =========================================================
  // UNIT TEST 1
  // Feed parsing extracts expected fields
  // =========================================================

  test('Feed parsing extracts expected fields from items', () => {

    const input = [
      {
        id: 'p1',
        name: 'Banana Chips',
        price: 250,
        flashSaleStart: '2026-08-13T10:00:00',
        flashSaleEnd: '2026-08-13T18:00:00',
        discount: 20,
        extraField: 'not needed'
      }
    ];

    const result = parseFeedItems(input);

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      id: 'p1',
      name: 'Banana Chips',
      price: 250,
      flashSaleStart: '2026-08-13T10:00:00',
      flashSaleEnd: '2026-08-13T18:00:00',
      discount: 20
    });

    expect(result[0].extraField).toBeUndefined();
  });


  // =========================================================
  // UNIT TEST 2
  // Expired promotions are filtered out
  // =========================================================

  test('Expired promotions are filtered out', () => {

    const now = Date.now();

    const expiredProduct = {
      id: 'expired',
      name: 'Expired Product',
      price: 200,
      flashSaleEnd: new Date(now - 60 * 1000)
    };

    const activeProduct = {
      id: 'active',
      name: 'Active Product',
      price: 300,
      flashSaleEnd: new Date(now + 60 * 60 * 1000)
    };

    expect(isStillRunning(expiredProduct)).toBe(false);

    expect(isStillRunning(activeProduct)).toBe(true);
  });


  // =========================================================
  // UNIT TEST 3
  // Sorting by start/end dates
  // =========================================================

  test('Sorting by start/end dates yields correct order', () => {

    const products = [

      {
        id: 'p3',
        flashSaleStart: '2026-08-13T15:00:00',
        flashSaleEnd: '2026-08-13T20:00:00'
      },

      {
        id: 'p1',
        flashSaleStart: '2026-08-13T10:00:00',
        flashSaleEnd: '2026-08-13T18:00:00'
      },

      {
        id: 'p2',
        flashSaleStart: '2026-08-13T10:00:00',
        flashSaleEnd: '2026-08-13T17:00:00'
      }

    ];

    const result = sortByStartEndDates(products);

    expect(result.map(product => product.id)).toEqual([
      'p2',
      'p1',
      'p3'
    ]);
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Empty feed input
  // =========================================================

  test('Empty feed input returns an empty list', () => {

    const result = parseFeedItems([]);

    expect(result).toEqual([]);

    expect(result).toHaveLength(0);
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Missing required fields
  // =========================================================

  test('Item missing required fields is skipped', () => {

    const input = [

      {
        id: 'valid',
        name: 'Valid Product',
        price: 300,
        flashSaleStart: '2026-08-13T10:00:00',
        flashSaleEnd: '2026-08-13T18:00:00'
      },

      {
        id: 'missing-price',
        name: 'No Price',
        flashSaleStart: '2026-08-13T10:00:00',
        flashSaleEnd: '2026-08-13T18:00:00'
      },

      {
        id: 'missing-start-date',
        name: 'No Start Date',
        price: 250,
        flashSaleEnd: '2026-08-13T18:00:00'
      },

      {
        id: 'missing-end-date',
        name: 'No End Date',
        price: 250,
        flashSaleStart: '2026-08-13T10:00:00'
      }

    ];

    const result = validateFeedItems(input);

    expect(result).toHaveLength(1);

    expect(result[0].id).toBe('valid');

    expect(
      result.some(product => product.id === 'missing-price')
    ).toBe(false);

    expect(
      result.some(product => product.id === 'missing-start-date')
    ).toBe(false);

    expect(
      result.some(product => product.id === 'missing-end-date')
    ).toBe(false);
  });

});