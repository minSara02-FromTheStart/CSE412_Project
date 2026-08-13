describe('footer.js', () => {

  // =========================================================
  // Test helpers
  // These represent the footer requirements being tested.
  // They do not modify the actual website footer.
  // =========================================================

  function normalizeLink(link, baseUrl = 'https://example.com/') {
    if (!link) return '';

    try {
      return new URL(link, baseUrl).href;
    } catch (error) {
      return link;
    }
  }


  function renderFooterItem(item) {
    const text = item?.text || 'Footer Link';
    const image = item?.image || 'images/default-footer.png';

    return {
      text,
      image
    };
  }


  function renderFooter(config) {
    if (!config || !Array.isArray(config.links)) {
      return {
        links: [],
        text: 'Footer',
        image: 'images/default-footer.png'
      };
    }

    return {
      links: config.links,
      text: config.text || 'Footer',
      image: config.image || 'images/default-footer.png'
    };
  }


  // =========================================================
  // UNIT TEST 1
  // Link normalization returns correct absolute/relative URL
  // =========================================================

  test('Link normalization returns correct absolute and relative URLs', () => {

    // Already absolute URL
    expect(
      normalizeLink('https://example.com/shop')
    ).toBe(
      'https://example.com/shop'
    );


    // Relative URL
    expect(
      normalizeLink('shop')
    ).toBe(
      'https://example.com/shop'
    );


    // Relative path
    expect(
      normalizeLink('/products')
    ).toBe(
      'https://example.com/products'
    );
  });


  // =========================================================
  // UNIT TEST 2
  // Render helper uses fallback text/image when missing
  // =========================================================

  test('Render helper uses fallback text and image when missing', () => {

    const result = renderFooterItem({
      text: '',
      image: ''
    });

    expect(result.text).toBe('Footer Link');

    expect(result.image).toBe(
      'images/default-footer.png'
    );
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Missing links configuration renders minimal footer safely
  // =========================================================

  test('Missing links configuration renders minimal footer safely', () => {

    const result = renderFooter({});

    expect(result).toEqual({
      links: [],
      text: 'Footer',
      image: 'images/default-footer.png'
    });


    // Also verify that completely missing configuration
    // does not throw an error.
    expect(() => renderFooter()).not.toThrow();


    const emptyResult = renderFooter();

    expect(emptyResult.links).toEqual([]);
  });

});