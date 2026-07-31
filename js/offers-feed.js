// offers-feed.js
// Loads live products from Firestore (same "products" collection used by
// products-feed.js / admin.html) and renders only the ones currently
// marked as an offer, i.e. products whose `badge` field (set from the
// admin panel) is "sale". Cards use the exact same markup/classes as the
// rest of the site (.card, .card-media, .card-footer, etc.) so styling,
// Add to Cart, Wishlist and Quick View all keep working unmodified.
//
// Dispatches "products:loaded" on `document` after rendering, same as
// products-feed.js, in case other scripts (search.js) want to hook in.

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// A product counts as "on offer" if it carries the "sale" badge from the
// admin panel, or has an explicit discount/originalPrice set.
function isOnOffer(product) {
  const badge = (product.badge || '').toLowerCase();
  return badge === 'sale' || !!product.discount || !!product.originalPrice;
}

function renderEmptyState() {
  const container = document.getElementById('product-container');
  if (!container) return;
  container.innerHTML = `
    <div class="promo-empty">
      <span class="promo-empty-icon">🏷️</span>
      <h3>No active offers right now</h3>
      <p>We don't have any discounted products at the moment — check back soon, or browse the full catalog.</p>
      <a class="explore-btn" href="products.html">Browse All Products</a>
    </div>
  `;
}

function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  if (products.length === 0) {
    renderEmptyState();
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
    return;
  }

  window.__nutriProductsById = window.__nutriProductsById || {};

  container.innerHTML = products.map(product => {
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

    const discountHtml = product.discount
      ? `<span class="discount-badge">-${product.discount}%</span>`
      : '';

    const ratingHtml = product.rating
      ? `<div class="rating">
           <span class="stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</span>
           <span class="rating-count">(${product.reviewCount || 0})</span>
         </div>`
      : '';

    const priceHtml = product.originalPrice
      ? `<h3>৳${product.price} <span style="text-decoration:line-through;color:var(--text-muted);font-weight:500;font-size:13px;">৳${product.originalPrice}</span></h3>`
      : `<h3>৳${product.price}</h3>`;

    return `
      <div class="card" data-category="${product.category || ''}">
        <div class="card-media">
          ${discountHtml}
          <button class="wishlist-btn" type="button" data-id="${product.id}" aria-label="Add to favourites" onclick="NutriNestWishlist.toggleWishlist(window.__nutriProductsById['${product.id}'], this)">♥</button>
          <img src="${imgSrc}" alt="${product.name}" loading="lazy">
          <div class="quick-actions">
            <button class="quick-view-btn" type="button" onclick="openQuickView(window.__nutriProductsById['${product.id}'])">Quick View</button>
          </div>
        </div>
        <div class="card-body">
          <h2>${product.name}</h2>
          ${ratingHtml}
          <div class="card-footer">
            <div>
              ${priceHtml}
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

  document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products } }));
}

async function loadOffers() {
  const container = document.getElementById('product-container');
  try {
    const snap = await getDocs(collection(db, 'products'));
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isOnOffer);
    renderProducts(products);
  } catch (error) {
    console.error('Error fetching offers:', error);
    if (container) {
      container.innerHTML = '<p class="error">Failed to load offers. Please try again shortly.</p>';
    }
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
  }
}

document.addEventListener('DOMContentLoaded', loadOffers);