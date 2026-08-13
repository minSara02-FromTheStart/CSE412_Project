describe('products.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  function searchProducts(products, query = '') {
    if (!Array.isArray(products)) {
      return [];
    }

    const normalizedQuery = String(query || '')
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter(product => {
      const name = String(product.name || '').toLowerCase();
      const category = String(product.category || '').toLowerCase();
      const description = String(product.description || '').toLowerCase();

      return (
        name.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }


  function createCache() {
    const cache = new Map();

    return {
      get(key) {
        return cache.has(key)
          ? cache.get(key)
          : null;
      },

      set(key, value) {
        cache.set(key, value);
      },

      invalidate(key) {
        cache.delete(key);
      },

      clear() {
        cache.clear();
      }
    };
  }


  function filtersToQueryParams(filters = {}) {
    const params = new URLSearchParams();

    if (filters.category) {
      params.set('category', filters.category);
    }

    if (
      filters.minPrice !== undefined &&
      filters.minPrice !== null
    ) {
      params.set('minPrice', String(filters.minPrice));
    }

    if (
      filters.maxPrice !== undefined &&
      filters.maxPrice !== null
    ) {
      params.set('maxPrice', String(filters.maxPrice));
    }

    return params.toString();
  }


  function mapApiProductToUI(product) {
    if (!product || typeof product !== 'object') {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      category: product.category || '',
      image: product.image ||
        'https://via.placeholder.com/300',
      price: product.price,
      unit: product.unit || 'KG',
      description: product.description || ''
    };
  }


  function safeSearch(products, query) {
    if (query === undefined || query === null) {
      return Array.isArray(products) ? products : [];
    }

    return searchProducts(products, query);
  }


  function safeFiltersToQueryParams(filters) {
    if (!filters || typeof filters !== 'object') {
      return '';
    }

    return filtersToQueryParams(filters);
  }


  // =========================================================
  // UNIT TEST 1
  // Search/filter pipeline
  // =========================================================

  test('Search and filter pipeline returns expected results', () => {

    const products = [
      {
        id: 'p1',
        name: 'Banana Chips',
        category: 'Chips',
        description: 'Crispy dried banana'
      },

      {
        id: 'p2',
        name: 'Dried Papaya',
        category: 'Dry Fruits',
        description: 'Sweet dried papaya'
      },

      {
        id: 'p3',
        name: 'Jackfruit Powder',
        category: 'Powder',
        description: 'Natural jackfruit powder'
      }
    ];

    expect(
      searchProducts(products, 'banana')
        .map(product => product.id)
    ).toEqual(['p1']);


    expect(
      searchProducts(products, 'powder')
        .map(product => product.id)
    ).toEqual(['p3']);


    expect(
      searchProducts(products, 'dried')
        .map(product => product.id)
    ).toEqual(['p2']);
  });


  // =========================================================
  // UNIT TEST 2
  // Caching/memoization
  // =========================================================

  test('Caching returns cached results and invalidates on updates', () => {

    const cache = createCache();

    const firstResult = [
      {
        id: 'p1',
        name: 'Banana Chips'
      }
    ];

    cache.set('banana', firstResult);

    expect(
      cache.get('banana')
    ).toBe(firstResult);


    // Update the cached result
    const updatedResult = [
      {
        id: 'p1',
        name: 'Updated Banana Chips'
      }
    ];

    cache.set('banana', updatedResult);

    expect(
      cache.get('banana')
    ).toBe(updatedResult);


    // Invalidate
    cache.invalidate('banana');

    expect(
      cache.get('banana')
    ).toBeNull();
  });


  // =========================================================
  // UNIT TEST 3
  // Filter → query parameter mapping
  // =========================================================

  test('Filter-to-query parameter mapping is correct', () => {

    const result = filtersToQueryParams({
      category: 'Dry Fruits',
      minPrice: 100,
      maxPrice: 500
    });

    const params = new URLSearchParams(result);

    expect(
      params.get('category')
    ).toBe('Dry Fruits');

    expect(
      params.get('minPrice')
    ).toBe('100');

    expect(
      params.get('maxPrice')
    ).toBe('500');
  });


  // =========================================================
  // UNIT TEST 4
  // API response → UI model mapping
  // =========================================================

  test('API response is mapped correctly to the UI model', () => {

    const apiProduct = {
      id: 'p1',
      name: 'Banana Chips',
      category: 'Chips',
      image: 'banana.jpg',
      price: 250,
      unit: 'KG',
      description: 'Crispy banana chips',
      extraField: 'ignored'
    };

    const result =
      mapApiProductToUI(apiProduct);

    expect(result).toEqual({
      id: 'p1',
      name: 'Banana Chips',
      category: 'Chips',
      image: 'banana.jpg',
      price: 250,
      unit: 'KG',
      description: 'Crispy banana chips'
    });
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Missing query parameter
  // =========================================================

  test('Missing query parameter uses default behavior safely', () => {

    const products = [
      {
        id: 'p1',
        name: 'Banana Chips'
      },

      {
        id: 'p2',
        name: 'Dried Papaya'
      }
    ];

    const result =
      safeSearch(products);

    expect(result).toEqual(products);

    expect(result).toHaveLength(2);
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Bad filter value types
  // =========================================================

  test('Bad filter value types are handled safely', () => {

    expect(() => {
      safeFiltersToQueryParams(null);
    }).not.toThrow();


    expect(
      safeFiltersToQueryParams(null)
    ).toBe('');


    expect(
      safeFiltersToQueryParams('invalid')
    ).toBe('');


    const result =
      safeFiltersToQueryParams({
        category: 'Chips',
        minPrice: 'not-a-number',
        maxPrice: 500
      });

    const params = new URLSearchParams(result);

    expect(
      params.get('category')
    ).toBe('Chips');

    expect(
      params.get('minPrice')
    ).toBe('not-a-number');

    expect(
      params.get('maxPrice')
    ).toBe('500');
  });

});