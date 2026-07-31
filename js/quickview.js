// quickview.js
// Opens a lightweight modal with product details, without navigating
// away from the product grid. Shared by index.html and products.html.
// Expects a #quickViewOverlay element to already exist in the page markup.

(function () {
  function ensureModal() {
    let overlay = document.getElementById('quickViewOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'quickViewOverlay';
    overlay.className = 'quickview-overlay';
    overlay.innerHTML = `
      <div class="quickview-modal" role="dialog" aria-modal="true" aria-labelledby="qvTitle">
        <button class="quickview-close" type="button" aria-label="Close">✕</button>
        <div class="quickview-media">
          <img id="qvImage" src="" alt="">
        </div>
        <div class="quickview-details">
          <h2 id="qvTitle"></h2>
          <h3 id="qvPrice"></h3>
          <p id="qvDesc"></p>
          <button class="cart-btn quickview-add-btn" id="qvAddBtn" type="button">Add to Cart</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeQuickView();
    });
    overlay.querySelector('.quickview-close').addEventListener('click', closeQuickView);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeQuickView();
    });

    return overlay;
  }

  function openQuickView(product) {
    if (!product) return;
    const overlay = ensureModal();

    overlay.querySelector('#qvImage').src = product.image || 'https://via.placeholder.com/300';
    overlay.querySelector('#qvImage').alt = product.name;
    overlay.querySelector('#qvTitle').textContent = product.name;
    overlay.querySelector('#qvPrice').textContent = `৳${product.price} / ${product.unit || 'KG'}`;
    overlay.querySelector('#qvDesc').textContent = product.desc || 'No description available.';

    const addBtn = overlay.querySelector('#qvAddBtn');
    addBtn.onclick = () => {
      if (typeof addToCart === 'function') {
        addToCart(product.name, product.price);
      }
      closeQuickView();
    };

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuickView() {
    const overlay = document.getElementById('quickViewOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  window.openQuickView = openQuickView;
  window.closeQuickView = closeQuickView;
})();