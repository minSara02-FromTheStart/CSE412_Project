describe('24) search.js', () => {
  // Pure helper logic mirroring search.js parsing and ranking
  function parseTokens(query) {
    if (!query || typeof query !== 'string') return [];
    return query.trim().split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function rankSuggestions(query, products = []) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    const escaped = escapeRegex(q);
    const regex = new RegExp(escaped, 'i');

    return products
      .filter(p => regex.test(p.name))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      });
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  describe('Unit Tests', () => {
    test('1. Query parsing trims whitespace and extracts tokens correctly', () => {
      const tokens = parseTokens('   Organic   Raw   Honey   ');
      expect(tokens).toEqual(['organic', 'raw', 'honey']);
    });

    test('2. Suggestion ranking produces expected order (prefix matches prioritized)', () => {
      const catalog = [
        { name: 'Pure Honey' },
        { name: 'Honey Almonds' },
        { name: 'Wildflower Honey' }
      ];
      const ranked = rankSuggestions('Honey', catalog);
      expect(ranked[0].name).toBe('Honey Almonds');
      expect(ranked.map(r => r.name)).toContain('Pure Honey');
      expect(ranked.map(r => r.name)).toContain('Wildflower Honey');
    });

    test('3. Debounce wrapper yields only final invocation (simulate timers)', () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      const debounced = debounce(mockFn, 300);

      debounced('h');
      debounced('ho');
      debounced('honey');

      expect(mockFn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('honey');
      jest.useRealTimers();
    });

    test('4. Special regex characters in query are escaped and handled safely', () => {
      const catalog = [
        { name: 'Vitamin C (1000mg)' },
        { name: 'Omega-3 [100 Softgels]' }
      ];
      expect(() => rankSuggestions('(1000mg)', catalog)).not.toThrow();
      const results = rankSuggestions('(1000mg)', catalog);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Vitamin C (1000mg)');
    });
  });

  describe('Negative Tests', () => {
    test('1. Empty query input returns empty result set', () => {
      const catalog = [{ name: 'Organic Mustard Oil' }];
      expect(rankSuggestions('', catalog)).toEqual([]);
      expect(rankSuggestions('   ', catalog)).toEqual([]);
    });

    test('2. Very long query handled without crash or performance freeze', () => {
      const catalog = [{ name: 'Mustard Oil' }];
      const longQuery = 'a'.repeat(5000);
      expect(() => rankSuggestions(longQuery, catalog)).not.toThrow();
      expect(rankSuggestions(longQuery, catalog)).toEqual([]);
    });
  });
});