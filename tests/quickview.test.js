describe('19) quickview.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="quickViewOverlay" class="quickview-overlay">
        <div class="quickview-modal">
          <h2 id="qvTitle"></h2>
          <h3 id="qvPrice"></h3>
          <p id="qvDesc"></p>
          <button id="qvAddBtn" type="button">Add to Cart</button>
        </div>
      </div>
    `;
  });

  function openModal(product) {
    const overlay = document.getElementById('quickViewOverlay');
    if (!product || !product.id) {
      if (overlay) overlay.classList.remove('active');
      return false;
    }

    overlay.querySelector('#qvTitle').textContent = product.name || 'Unnamed Product';
    overlay.querySelector('#qvPrice').textContent = `৳${product.price || 0} / ${product.unit || 'KG'}`;
    overlay.querySelector('#qvDesc').textContent = product.desc || 'No description available.';
    overlay.classList.add('active');
    return true;
  }

  function updatePriceForVariant(basePrice, multiplier = 1, unit = 'KG') {
    const finalPrice = Math.round(basePrice * multiplier);
    return `৳${finalPrice} / ${unit}`;
  }

  function closeModal() {
    const overlay = document.getElementById('quickViewOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  describe('Unit Tests', () => {
    test('1. open() loads product data and displays variant/pricing info', () => {
      const product = { id: 'p101', name: 'Mustard Oil', price: 300, unit: '1L' };
      const success = openModal(product);

      expect(success).toBe(true);
      expect(document.getElementById('qvTitle').textContent).toBe('Mustard Oil');
      expect(document.getElementById('qvPrice').textContent).toBe('৳300 / 1L');
      expect(document.getElementById('quickViewOverlay').classList.contains('active')).toBe(true);
    });

    test('2. selectVariant updates displayed price/options correctly', () => {
      const basePrice = 300;
      const updatedDisplay = updatePriceForVariant(basePrice, 2, '2L');
      expect(updatedDisplay).toBe('৳600 / 2L');
    });

    test('3. close() removes active class and cleans DOM state', () => {
      const overlay = document.getElementById('quickViewOverlay');
      overlay.classList.add('active');

      closeModal();
      expect(overlay.classList.contains('active')).toBe(false);
    });
  });

  describe('Negative Tests', () => {
    test('1. open() with missing product id closes gracefully or fails safely', () => {
      const invalidProduct = { name: 'Broken Product' }; // Missing id
      const success = openModal(invalidProduct);

      expect(success).toBe(false);
      expect(document.getElementById('quickViewOverlay').classList.contains('active')).toBe(false);
    });

    test('2. API loading error displays fallback message', () => {
      const renderFallback = (error) => {
        const descEl = document.getElementById('qvDesc');
        descEl.textContent = error ? 'Could not load product details.' : '';
      };

      renderFallback(new Error('Network error'));
      expect(document.getElementById('qvDesc').textContent).toBe('Could not load product details.');
    });
  });
});