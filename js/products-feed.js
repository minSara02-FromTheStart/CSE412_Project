// products-feed.js
// Loads live products from Firestore (the same "products" collection the
// admin panel writes to) so anything added/edited/deleted in admin.html
// shows up here automatically. Replaces the old fetch('http://localhost:3001/...')
// call, which pointed at a local API server that was never actually running
// in production — that's why admin-added products never appeared on the site.
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
    // Lookup map so inline onclick handlers can reference full product
    // data by id, without JSON-stringifying it into the HTML attribute
    // (which would break on names/descriptions containing quotes).
    window.__nutriProductsById = window.__nutriProductsById || {};

    container.innerHTML = visibleProducts.map(product => {
      const safeName = product.name.replace(/'/g, "\\'");
      const imgSrc = product.image || 'https://via.placeholder.com/300';
      const desc = product.desc || product.description || '';

      window.__nutriProductsById[product.id] = {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'KG',
        image: imgSrc,
        desc
      };

      // Optional badge: a product can carry a `badge` field ("new",
      // "bestseller", "sale") set from the admin panel. If absent, no
      // badge is shown rather than faking one.
      const badgeMap = {
        new: { label: 'New', cls: 'badge-new' },
        bestseller: { label: 'Bestseller', cls: 'badge-bestseller' },
        sale: { label: 'Sale', cls: 'badge-sale' }
      };
      const badgeInfo = product.badge && badgeMap[product.badge.toLowerCase()];
      const badgeHtml = badgeInfo
        ? `<span class="product-badge ${badgeInfo.cls}">${badgeInfo.label}</span>`
        : '';

      // Optional rating: only render if the product actually has one.
      const ratingHtml = product.rating
        ? `<div class="rating">
             <span class="stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</span>
             <span class="rating-count">(${product.reviewCount || 0})</span>
           </div>`
        : '';

      return `
      <div class="card" data-category="${product.category || ''}">
        <div class="card-media">
          ${badgeHtml}
          <button class="wishlist-btn" type="button" data-id="${product.id}" aria-label="Add to favourites" onclick="NutriNestWishlist.toggleWishlist(window.__nutriProductsById['${product.id}'], this)">♥</button>
          <img src="${imgSrc}" alt="${product.name}" loading="lazy">
          <div class="quick-actions">
            <button class="quick-view-btn" type="button" onclick="openQuickView(window.__nutriProductsById['${product.id}'])">Quick View</button>
          </div>
        </div>
        <div class="card-body">
          <h2>${product.name}</h2>
          ${ratingHtml}
          <!-- Description removed -->
          <div class="card-footer">
            <div>
              <h3>৳${product.price}</h3>
              <span class="unit">/ ${product.unit || 'KG'}</span>
            </div>
            <button class="cart-btn" onclick="addToCart('${product.id}', '${safeName}', ${product.price})">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
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
