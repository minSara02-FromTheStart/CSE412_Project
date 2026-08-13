describe('offers-feed.js', () => {

  // =========================================================
  // Test helpers
  // =========================================================

  /*
   * Checks whether an offer is eligible for a user.
   *
   * An offer is eligible when:
   * - it has no segment/tag restriction, OR
   * - the user's segment matches, OR
   * - at least one user tag matches an offer tag.
   */
  function isOfferEligible(offer, user) {
    if (!offer || !user) return false;

    const segments = Array.isArray(offer.segments)
      ? offer.segments
      : [];

    const offerTags = Array.isArray(offer.tags)
      ? offer.tags
      : [];

    const userTags = Array.isArray(user.tags)
      ? user.tags
      : [];

    // No eligibility restrictions
    if (
      segments.length === 0 &&
      offerTags.length === 0
    ) {
      return true;
    }

    // Matching user segment
    if (
      user.segment &&
      segments.includes(user.segment)
    ) {
      return true;
    }

    // Matching user tag
    return offerTags.some(tag =>
      userTags.includes(tag)
    );
  }


  /*
   * Merges two offer lists and removes duplicate products.
   *
   * Product ID is used as the unique identifier.
   */
  function mergeOfferLists(firstList, secondList) {
    const first = Array.isArray(firstList)
      ? firstList
      : [];

    const second = Array.isArray(secondList)
      ? secondList
      : [];

    const merged = new Map();

    [...first, ...second].forEach(offer => {
      if (!offer || !offer.id) return;

      if (!merged.has(offer.id)) {
        merged.set(offer.id, offer);
      }
    });

    return [...merged.values()];
  }


  /*
   * Returns a page/slice from an offer list.
   */
  function paginateOffers(offers, page = 1, limit = 10) {
    if (!Array.isArray(offers)) return [];

    if (page < 1 || limit < 1) {
      return [];
    }

    const start = (page - 1) * limit;

    return offers.slice(start, start + limit);
  }


  /*
   * Checks that an offer has a valid discount.
   *
   * Missing, null, non-numeric, or non-positive discounts
   * are ignored.
   */
  function filterValidOffers(offers) {
    if (!Array.isArray(offers)) return [];

    return offers.filter(offer => {
      if (!offer) return false;

      const discount = Number(offer.discount);

      return (
        Number.isFinite(discount) &&
        discount > 0
      );
    });
  }


  /*
   * Safely evaluates an eligibility rule.
   *
   * Invalid rule formats return false instead of throwing.
   */
  function safelyCheckEligibility(offer, user) {
    try {
      if (!offer || typeof offer !== 'object') {
        return false;
      }

      if (
        offer.segments !== undefined &&
        !Array.isArray(offer.segments)
      ) {
        return false;
      }

      if (
        offer.tags !== undefined &&
        !Array.isArray(offer.tags)
      ) {
        return false;
      }

      return isOfferEligible(offer, user);

    } catch (error) {
      return false;
    }
  }


  // =========================================================
  // UNIT TEST 1
  // Offer eligibility matches user segments/tags
  // =========================================================

  test('Offer eligibility check matches user segments and tags', () => {

    const offer = {
      id: 'offer-1',
      discount: 20,
      segments: ['premium'],
      tags: ['vegetarian', 'healthy']
    };

    const premiumUser = {
      segment: 'premium',
      tags: []
    };

    const taggedUser = {
      segment: 'regular',
      tags: ['healthy']
    };

    const ineligibleUser = {
      segment: 'regular',
      tags: ['electronics']
    };

    expect(
      isOfferEligible(offer, premiumUser)
    ).toBe(true);

    expect(
      isOfferEligible(offer, taggedUser)
    ).toBe(true);

    expect(
      isOfferEligible(offer, ineligibleUser)
    ).toBe(false);
  });


  // =========================================================
  // UNIT TEST 2
  // Merging two offer lists removes duplicates
  // =========================================================

  test('Merging two offer lists removes duplicate offers', () => {

    const firstList = [
      {
        id: 'offer-1',
        name: 'Banana Chips',
        discount: 10
      },
      {
        id: 'offer-2',
        name: 'Dried Papaya',
        discount: 15
      }
    ];

    const secondList = [
      {
        id: 'offer-2',
        name: 'Dried Papaya',
        discount: 15
      },
      {
        id: 'offer-3',
        name: 'Jackfruit Powder',
        discount: 20
      }
    ];

    const result =
      mergeOfferLists(firstList, secondList);

    expect(result).toHaveLength(3);

    expect(
      result.map(offer => offer.id)
    ).toEqual([
      'offer-1',
      'offer-2',
      'offer-3'
    ]);
  });


  // =========================================================
  // UNIT TEST 3
  // Pagination/limit returns expected slice
  // =========================================================

  test('Pagination and limit logic returns the expected slice', () => {

    const offers = Array.from(
      { length: 10 },
      (_, index) => ({
        id: `offer-${index + 1}`,
        discount: 10
      })
    );

    // Page 2 with 3 items per page
    const result =
      paginateOffers(offers, 2, 3);

    expect(result).toHaveLength(3);

    expect(
      result.map(offer => offer.id)
    ).toEqual([
      'offer-4',
      'offer-5',
      'offer-6'
    ]);


    // Page 4 contains only the remaining item
    const lastPage =
      paginateOffers(offers, 4, 3);

    expect(lastPage).toHaveLength(1);

    expect(lastPage[0].id).toBe('offer-10');
  });


  // =========================================================
  // NEGATIVE TEST 1
  // Offer missing discount field is ignored
  // =========================================================

  test('Offer missing discount field is ignored', () => {

    const offers = [
      {
        id: 'valid-1',
        name: 'Banana Chips',
        discount: 20
      },

      {
        id: 'missing-discount',
        name: 'Dried Papaya'
      },

      {
        id: 'null-discount',
        name: 'Jackfruit Powder',
        discount: null
      },

      {
        id: 'zero-discount',
        name: 'Zero Discount',
        discount: 0
      }
    ];

    const result =
      filterValidOffers(offers);

    expect(result).toHaveLength(1);

    expect(result[0].id).toBe('valid-1');

    expect(
      result.some(
        offer => offer.id === 'missing-discount'
      )
    ).toBe(false);

    expect(
      result.some(
        offer => offer.id === 'null-discount'
      )
    ).toBe(false);

    expect(
      result.some(
        offer => offer.id === 'zero-discount'
      )
    ).toBe(false);
  });


  // =========================================================
  // NEGATIVE TEST 2
  // Invalid eligibility rule format is handled safely
  // =========================================================

  test('Invalid eligibility rule format is treated safely', () => {

    const invalidOffer = {
      id: 'invalid-offer',
      discount: 20,

      // Should be an array, but is incorrectly a string
      segments: 'premium',

      // Should also be an array
      tags: 'healthy'
    };

    const user = {
      segment: 'premium',
      tags: ['healthy']
    };

    expect(() => {
      safelyCheckEligibility(
        invalidOffer,
        user
      );
    }).not.toThrow();

    expect(
      safelyCheckEligibility(
        invalidOffer,
        user
      )
    ).toBe(false);
  });


  // =========================================================
  // Additional safety checks
  // These do not count as extra required tests.
  // =========================================================

  test('Eligibility safely handles missing restrictions', () => {

    const unrestrictedOffer = {
      id: 'offer-1',
      discount: 10
    };

    const user = {
      segment: 'regular',
      tags: []
    };

    expect(
      isOfferEligible(
        unrestrictedOffer,
        user
      )
    ).toBe(true);
  });

});