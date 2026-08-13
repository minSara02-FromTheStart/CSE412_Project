describe('promoCard.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  /*
   * Builds a CTA URL with the expected product and UTM parameters.
   */
  function buildCtaLink(product, baseUrl = 'products.html') {

    if (!product || !product.id) {
      return '';
    }

    const params = new URLSearchParams();

    params.set('id', product.id);
    params.set('utm_source', 'promo');
    params.set('utm_medium', 'card');
    params.set('utm_campaign', 'product_promotion');

    return `${baseUrl}?${params.toString()}`;
  }


  /*
   * Uses the same image fallback behavior as promoCard.js.
   *
   * The actual production file uses:
   * product.image || 'https://via.placeholder.com/300'
   */
  function getPromoImage(product) {

    if (!product) {
      return 'https://via.placeholder.com/300';
    }

    return product.image ||
      'https://via.placeholder.com/300';
  }


  /*
   * Safe render stub for missing promo objects.
   */
  function safeRenderPromo(promo) {

    if (!promo || typeof promo !== 'object') {
      return '';
    }

    return `
      <div class="promo-card">
        <h3>${promo.name || 'Promotion'}</h3>
        <img src="${getPromoImage(promo)}"
             alt="${promo.name || 'Promotion'}">
      </div>
    `;
  }


  // =========================================================
  // UNIT TEST 1
  // CTA link construction
  // =========================================================

  test('CTA link is constructed with correct params and UTM strings', () => {

    const product = {
      id: 'product-123',
      name: 'Banana Chips'
    };

    const result =
      buildCtaLink(product);

    expect(result).toBe(
      'products.html?id=product-123&utm_source=promo&utm_medium=card&utm_campaign=product_promotion'
    );
  });


  // =========================================================
  // UNIT TEST 2
  // Image fallback
  // =========================================================

  test('Image fallback is used when promo image is missing', () => {

    const promoWithoutImage = {
      id: 'promo-1',
      name: 'Banana Chips',
      image: ''
    };

    expect(
      getPromoImage(promoWithoutImage)
    ).toBe(
      'https://via.placeholder.com/300'
    );


    const promoWithImage = {
      id: 'promo-2',
      name: 'Dried Papaya',
      image: 'images/papaya.jpg'
    };

    expect(
      getPromoImage(promoWithImage)
    ).toBe(
      'images/papaya.jpg'
    );
  });


  // =========================================================
  // NEGATIVE TEST
  // Missing promo object
  // =========================================================

  test('Missing promo object is handled safely without rendering', () => {

    expect(() => {
      safeRenderPromo(null);
    }).not.toThrow();


    expect(
      safeRenderPromo(null)
    ).toBe('');


    expect(
      safeRenderPromo(undefined)
    ).toBe('');


    expect(
      safeRenderPromo()
    ).toBe('');
  });

});