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

  if (products.length === 0) {
    container.innerHTML = '<p>No products available.</p>';
  } else {
    container.innerHTML = products.map(product => `
      <div class="card" data-category="${product.category || ''}">
        <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
        <h2>${product.name}</h2>
        <h3>৳${product.price} / ${product.unit || 'KG'}</h3>
        <p>${product.desc || product.description || ''}</p>
        <button class="cart-btn" onclick="addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price})">
          Add to Cart
        </button>
      </div>
    `).join('');
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
