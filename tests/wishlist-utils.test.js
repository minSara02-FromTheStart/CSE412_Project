describe('27) wishlist-utils.js', () => {
  function normalizeWishlistItem(item) {
    if (!item || typeof item !== 'object') {
      return {
        id: 'unknown-id',
        name: 'Unnamed Product',
        price: 0,
        image: 'https://via.placeholder.com/150',
        inStock: true
      };
    }

    return {
      id: item.id ? String(item.id) : 'unknown-id',
      name: item.name || 'Unnamed Product',
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      image: item.image || 'https://via.placeholder.com/150',
      inStock: typeof item.inStock === 'boolean' ? item.inStock : true
    };
  }

  describe('Unit Tests', () => {
    test('1. Normalise product fills missing fields with valid defaults', () => {
      const raw = { id: 'p101', name: 'Organic Honey' };
      const normalized = normalizeWishlistItem(raw);

      expect(normalized.id).toBe('p101');
      expect(normalized.name).toBe('Organic Honey');
      expect(normalized.price).toBe(0);
      expect(normalized.image).toContain('placeholder.com');
      expect(normalized.inStock).toBe(true);
    });

    test('2. Defaults applied correctly when product id is missing', () => {
      const raw = { name: 'Chia Seeds', price: 250 };
      const normalized = normalizeWishlistItem(raw);

      expect(normalized.id).toBe('unknown-id');
      expect(normalized.price).toBe(250);
    });
  });

  describe('Negative Tests', () => {
    test('1. Product with null/undefined id returns defined fallback without crash', () => {
      expect(normalizeWishlistItem(null)).toEqual({
        id: 'unknown-id',
        name: 'Unnamed Product',
        price: 0,
        image: 'https://via.placeholder.com/150',
        inStock: true
      });

      expect(normalizeWishlistItem({ id: null })).toEqual({
        id: 'unknown-id',
        name: 'Unnamed Product',
        price: 0,
        image: 'https://via.placeholder.com/150',
        inStock: true
      });
    });
  });
});



function toggleInList(list, product) {
  const normalised = normaliseProduct(product);
  if (!normalised) return list;

  const exists = list.some(item => item.id === normalised.id || item.productId === normalised.id);

  if (exists) {
    return list.filter(item => item.id !== normalised.id && item.productId !== normalised.id);
  }

  return [...list, { ...normalised, savedAt: new Date().toISOString() }];
}

function persistList(storage, key, list) {
  storage.setItem(key, JSON.stringify(list));
  return JSON.parse(storage.getItem(key));
}

module.exports = { normaliseProduct, toggleInList, persistList };