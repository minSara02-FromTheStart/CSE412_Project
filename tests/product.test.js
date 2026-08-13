describe('product.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  // Formats a price as Bangladeshi Taka with two decimals.
  function formatPrice(price) {
    const value = Number(price);

    if (!Number.isFinite(value)) {
      return '৳0.00';
    }

    return `৳${value.toFixed(2)}`;
  }


  // Determines whether a product is available.
  function isAvailable(stock) {
    const value = Number(stock);

    return Number.isFinite(value) && value > 0;
  }


  // Finds a variant by its ID.
  function selectVariant(variants, variantId) {
    if (!Array.isArray(variants)) {
      return null;
    }

    return variants.find(
      variant => variant && variant.id === variantId
    ) || null;
  }


  // Creates a URL-safe slug.
  function generateSlug(value) {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }


  // Validates the minimum product data.
  function validateProduct(product) {
    if (!product || !product.id) {
      throw new Error('Product id is required');
    }

    if (
      product.price === undefined ||
      product.price === null
    ) {
      throw new Error('Product price is required');
    }

    const price = Number(product.price);

    if (!Number.isFinite(price)) {
      throw new Error('Product price must be numeric');
    }

    return {
      ...product,
      price
    };
  }


  // =========================================================
  // UNIT TEST 1
  // Price formatting
  // =========================================================

  test('Price formatting for currency and decimals is correct', () => {

    expect(
      formatPrice(250)
    ).toBe('৳250.00');

    expect(
      formatPrice(250.5)
    ).toBe('৳250.50');

    expect(
      formatPrice(99.999)
    ).toBe('৳100.00');

    expect(
      formatPrice(0)
    ).toBe('৳0.00');
  });


  // =========================================================
  // UNIT TEST 2
  // Availability flag for stock values
  // =========================================================

  test('Availability flag is correct for stock values', () => {

    expect(
      isAvailable(10)
    ).toBe(true);

    expect(
      isAvailable(1)
    ).toBe(true);

    expect(
      isAvailable(0)
    ).toBe(false);

    expect(
      isAvailable(-5)
    ).toBe(false);
  });


  // =========================================================
  // UNIT TEST 3
  // Variant selection by ID
  // =========================================================

  test('Variant selection returns the expected variant object by id', () => {

    const variants = [
      {
        id: 'small',
        name: 'Small',
        price: 200
      },

      {
        id: 'medium',
        name: 'Medium',
        price: 300
      },

      {
        id: 'large',
        name: 'Large',
        price: 400
      }
    ];

    const result =
      selectVariant(variants, 'medium');

    expect(result).toEqual({
      id: 'medium',
      name: 'Medium',
      price: 300
    });
  });


  // =========================================================
  // UNIT TEST 4
  // Slug generation
  // =========================================================

  test('Slug generation sanitizes and escapes properly', () => {

    expect(
      generateSlug('Banana Chips')
    ).toBe('banana-chips');

    expect(
      generateSlug('Dried Papaya & Powder!')
    ).toBe('dried-papaya-powder');

    expect(
      generateSlug('  Jackfruit   Powder  ')
    ).toBe('jackfruit-powder');

    expect(
      generateSlug('Organic-Banana-Chips')
    ).toBe('organic-banana-chips');
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Missing id or price
  // =========================================================

  test('Missing id or price is handled with a validation error', () => {

    expect(() => {
      validateProduct({
        name: 'Banana Chips',
        price: 250
      });
    }).toThrow('Product id is required');


    expect(() => {
      validateProduct({
        id: 'product-1',
        name: 'Banana Chips'
      });
    }).toThrow('Product price is required');
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Non-numeric price
  // =========================================================

  test('Non-numeric price causes a validation error', () => {

    expect(() => {
      validateProduct({
        id: 'product-1',
        name: 'Banana Chips',
        price: 'not-a-number'
      });
    }).toThrow('Product price must be numeric');


    expect(() => {
      validateProduct({
        id: 'product-2',
        name: 'Dried Papaya',
        price: 'abc'
      });
    }).toThrow('Product price must be numeric');
  });

});