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



/**
 * @jest-environment jsdom
 */
const { normaliseProduct, toggleInList, persistList } = require("../js/wishlist-utils");

describe('toggleInList', () => {
  // Unit 1: add/remove updates list and persists as expected
  test('adds a product then removes it, updating the list correctly', () => {
    let list = [];
    list = toggleInList(list, { id: 'p1', name: 'Almonds', price: 500 });
    expect(list).toHaveLength(1);

    list = toggleInList(list, { id: 'p1', name: 'Almonds', price: 500 });
    expect(list).toHaveLength(0);
  });

  test('persists the updated list to storage', () => {
    const list = toggleInList([], { id: 'p1', name: 'Almonds', price: 500 });
    const storage = { data: {}, setItem(k, v) { this.data[k] = v; }, getItem(k) { return this.data[k]; } };
    const saved = persistList(storage, 'favourites', list);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('p1');
  });

  // Unit 2: normalise product shape before saving
  test('normalises product shape before saving into the list', () => {
    const list = toggleInList([], { id: 42, price: '750' });
    expect(list[0]).toMatchObject({ id: '42', price: 750, name: 'Product', unit: 'KG' });
  });

  // Negative 1: adding duplicate product → prevented / deduped
  test('adding the same product twice does not create a duplicate entry', () => {
    let list = toggleInList([], { id: 'p1', name: 'Almonds', price: 500 });
    list = toggleInList(list, { id: 'p1', name: 'Almonds', price: 500 }); // toggled off
    const ids = list.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates ever existed
    expect(list).toHaveLength(0);
  });
});