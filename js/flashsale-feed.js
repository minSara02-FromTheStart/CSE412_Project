// flashsale-feed.js
// Loads live products from Firestore and renders only the ones currently
// part of the flash sale, then drives the countdown banner in flashsale.html.
//
// A product qualifies as a flash-sale item if either:
//   - it has `flashSale: true` set (optionally with `flashSaleEnd`, an ISO
//     date string or Firestore Timestamp, set from the admin panel), or
//   - as a fallback (so this page isn't empty before the admin panel adds
//     flash-sale support), it carries the "sale" badge.
//
// The countdown counts down to the earliest `flashSaleEnd` among the
// qualifying products. If none of them specify an end time, it falls back
// to the end of the current day, framed as a "today only" sale.

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function isFlashSale(product) {
  const badge = (product.badge || '').toLowerCase();
  return product.flashSale === true || badge === 'sale';
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getEndTime(products) {
  const explicitEnds = products
    .map(p => toDate(p.flashSaleEnd))
    .filter(d => d && d.getTime() > Date.now());

  if (explicitEnds.length > 0) {
    return new Date(Math.min(...explicitEnds.map(d => d.getTime())));
  }

  // Fallback: end of today, local time.
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

function startCountdown(endTime) {
  const el = document.getElementById('countdown');
  if (!el) return;

  const hoursEl = el.querySelector('[data-unit="hours"]');
  const minsEl = el.querySelector('[data-unit="minutes"]');
  const secsEl = el.querySelector('[data-unit="seconds"]');

  function tick() {
    const diff = endTime.getTime() - Date.now();
    if (diff <= 0) {
      el.classList.add('ended');
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      clearInterval(timer);
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  tick();
  const timer = setInterval(tick, 1000);
}

function renderEmptyState() {
  const container = document.getElementById('product-container');
  if (!container) return;
  container.innerHTML = `
    <div class="promo-empty">
      <span class="promo-empty-icon">⚡</span>
      <h3>No flash sale running right now</h3>
      <p>There's no active flash sale at the moment — check back soon, or browse the full catalog.</p>
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
      : `<span class="discount-badge">⚡ Flash</span>`;

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

async function loadFlashSale() {
  const container = document.getElementById('product-container');
  try {
    const snap = await getDocs(collection(db, 'products'));
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(isFlashSale);
    renderProducts(products);
    if (products.length > 0) {
      startCountdown(getEndTime(products));
    }
  } catch (error) {
    console.error('Error fetching flash sale products:', error);
    if (container) {
      container.innerHTML = '<p class="error">Failed to load the flash sale. Please try again shortly.</p>';
    }
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
  }
}

document.addEventListener('DOMContentLoaded', loadFlashSale);