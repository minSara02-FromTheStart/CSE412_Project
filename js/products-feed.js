// products-feed.js
// Loads live products from Firestore (the same "products" collection the
// admin panel writes to) so anything added/edited/deleted in admin.html
// shows up here automatically.
//
// Uses the same shared card renderer as offers-feed.js / flashsale-feed.js
// (promoCard.js), so a product marked onOffer/flashSale in the admin
// panel looks the same everywhere -- same discount badge, same
// strikethrough original price -- instead of showing as a plain card
// here and only looking "on sale" on the dedicated promo pages.
//
// After rendering, this dispatches a "products:loaded" event on `document`
// so other scripts (search.js, categoryFilter.js) that need to read the
// rendered .card elements know it's safe to run -- since this fetch is
// async, DOMContentLoaded fires long before the cards actually exist.

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderCard } from "./promoCard.js";

// New/Bestseller/Sale label set from the admin panel's `badge` field.
// Sits top-left on the card.
const BADGE_MAP = {
  new: { label: 'New', cls: 'badge-new' },
  bestseller: { label: 'Bestseller', cls: 'badge-bestseller' },
  sale: { label: 'Sale', cls: 'badge-sale' }
};

// The "on sale" overlay -- top-right on the card, same visual language
// as offers.html / flashsale.html. Flash sale takes priority over a
// plain offer if a product is somehow both.
function saleOverlayHtml(product) {
  if (product.flashSale) {
    return `<span class="discount-badge">⚡ Flash Sale</span>`;
  }
  if (product.onOffer) {
    return product.discount
      ? `<span class="discount-badge">-${product.discount}%</span>`
      : `<span class="discount-badge">🏷️ Offer</span>`;
  }
  return '';
}

function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  // Pages (e.g. the homepage) can cap how many product cards show by
  // setting data-limit="4" on #product-container. products.html has no
  // limit attribute, so it still renders the full catalog.
  const limitAttr = container.dataset.limit;
  const limit = limitAttr ? parseInt(limitAttr, 10) : null;
  const visibleProducts = limit ? products.slice(0, limit) : products;

  if (products.length === 0) {
    container.innerHTML = '<p>No products available.</p>';
  } else {
    container.innerHTML = visibleProducts.map(product => {
      const badgeInfo = product.badge && BADGE_MAP[product.badge.toLowerCase()];
      const newBestsellerHtml = badgeInfo
        ? `<span class="product-badge ${badgeInfo.cls}">${badgeInfo.label}</span>`
        : '';

      return renderCard(product, {
        badgeHtml: newBestsellerHtml + saleOverlayHtml(product)
      });
    }).join('');
  }

  document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products } }));
}

async function loadProducts() {
  const container = document.getElementById('product-container');
  try {
    const snap = await getDocs(collection(db, 'products'));
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    if (container) {
      container.innerHTML = '<p class="error">Failed to load products. Please try again shortly.</p>';
    }
    // Still fire the event (with no products) so listeners don't hang forever
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);