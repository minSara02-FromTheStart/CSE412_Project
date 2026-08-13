describe('products-feed.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  function mapProduct(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    if (!raw.id || !raw.name || raw.price === undefined) {
      return null;
    }

    return {
      id: raw.id,
      name: raw.name,
      price: raw.price,
      unit: raw.unit || 'KG',
      image: raw.image || '',
      stock: raw.stock ?? 0
    };
  }


  function mapProducts(rawItems) {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    return rawItems
      .map(mapProduct)
      .filter(Boolean);
  }


  function applyGlobalFilters(products, options = {}) {
    if (!Array.isArray(products)) {
      return [];
    }

    let result = [...products];

    if (options.hideOutOfStock === true) {
      result = result.filter(product =>
        Number(product.stock) > 0
      );
    }

    return result;
  }


  function paginateProducts(products, offset = 0, limit = null) {
    if (!Array.isArray(products)) {
      return [];
    }

    const safeOffset = Math.max(
      0,
      Number.isFinite(Number(offset))
        ? Number(offset)
        : 0
    );

    if (limit === null || limit === undefined) {
      return products.slice(safeOffset);
    }

    const safeLimit = Number(limit);

    if (!Number.isFinite(safeLimit) || safeLimit <= 0) {
      return [];
    }

    return products.slice(
      safeOffset,
      safeOffset + safeLimit
    );
  }


  // =========================================================
  // UNIT TEST 1
  // Raw feed item mapped to product model
  // =========================================================

  test('Raw feed item is mapped to a product model with required fields', () => {

    const rawItem = {
      id: 'product-1',
      name: 'Banana Chips',
      price: 250,
      unit: 'KG',
      image: 'banana.jpg',
      stock: 20,
      extraField: 'ignored'
    };

    const result = mapProduct(rawItem);

    expect(result).toEqual({
      id: 'product-1',
      name: 'Banana Chips',
      price: 250,
      unit: 'KG',
      image: 'banana.jpg',
      stock: 20
    });
  });


  // =========================================================
  // UNIT TEST 2
  // Global filters
  // =========================================================

  test('Global filters hide out-of-stock products correctly', () => {

    const products = [
      {
        id: 'p1',
        name: 'Banana Chips',
        price: 250,
        stock: 10
      },
      {
        id: 'p2',
        name: 'Dried Papaya',
        price: 300,
        stock: 0
      },
      {
        id: 'p3',
        name: 'Jackfruit Powder',
        price: 400,
        stock: 5
      }
    ];

    const result = applyGlobalFilters(
      products,
      { hideOutOfStock: true }
    );

    expect(result).toHaveLength(2);

    expect(
      result.map(product => product.id)
    ).toEqual([
      'p1',
      'p3'
    ]);
  });


  // =========================================================
  // UNIT TEST 3
  // Pagination / offset
  // =========================================================

  test('Pagination and offset return the expected subset', () => {

    const products = Array.from(
      { length: 10 },
      (_, index) => ({
        id: `product-${index + 1}`,
        name: `Product ${index + 1}`,
        price: 100 + index
      })
    );

    const result =
      paginateProducts(products, 3, 4);

    expect(result).toHaveLength(4);

    expect(
      result.map(product => product.id)
    ).toEqual([
      'product-4',
      'product-5',
      'product-6',
      'product-7'
    ]);
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Empty source input
  // =========================================================

  test('Empty source input returns an empty list', () => {

    expect(
      mapProducts([])
    ).toEqual([]);

    expect(
      applyGlobalFilters([])
    ).toEqual([]);

    expect(
      paginateProducts([], 0, 10)
    ).toEqual([]);
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Malformed raw entries are skipped and logged
  // =========================================================

  test('Malformed raw entries are skipped and logged', () => {

    const consoleSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});


    function safeMapProducts(items) {

      if (!Array.isArray(items)) {
        return [];
      }

      return items
        .map(item => {

          const result = mapProduct(item);

          if (!result) {
            console.warn(
              'Skipping malformed product entry:',
              item
            );
          }

          return result;
        })
        .filter(Boolean);
    }


    const rawItems = [
      {
        id: 'valid-1',
        name: 'Banana Chips',
        price: 250,
        stock: 10
      },

      {
        name: 'Missing ID',
        price: 300
      },

      {
        id: 'missing-price',
        name: 'Missing Price'
      },

      null,

      'invalid-entry'
    ];


    const result =
      safeMapProducts(rawItems);


    expect(result).toHaveLength(1);

    expect(result[0].id).toBe('valid-1');

    expect(consoleSpy).toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalledTimes(4);

    consoleSpy.mockRestore();
  });

});