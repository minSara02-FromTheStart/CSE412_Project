// new-arrivals-feed.js
// Shows the most recently added products automatically -- no admin
// checkbox needed, unlike offers-feed.js (onOffer) or flashsale-feed.js
// (flashSale). Whatever gets added in admin.html shows up here right
// away, ordered by createdAt (newest first), capped at 12 so the page
// doesn't grow unbounded as the catalog does.
//
// Uses the same shared card renderer as offers-feed.js / flashsale-feed.js
// (promoCard.js) so the cards look identical to the rest of the site.
//
// Dispatches "products:loaded" on `document` after rendering, same as
// the other feeds, so search.js/categoryFilter.js/wishlist.js can hook in.

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderCard, renderEmptyState } from "./promoCard.js";

const MAX_ITEMS = 12;

function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  if (products.length === 0) {
    renderEmptyState(container, {
      icon: '✨',
      title: 'No new arrivals yet',
      message: "We haven't added anything new recently — check back soon, or browse the full catalog."
    });
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
    return;
  }

  container.innerHTML = products.map(product => renderCard(product, {
    badgeHtml: `<span class="product-badge badge-new">🆕 New</span>`
  })).join('');

  document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products } }));
}

async function loadNewArrivals() {
  const container = document.getElementById('product-container');
  try {
    const newArrivalsQuery = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(MAX_ITEMS)
    );
    const snap = await getDocs(newArrivalsQuery);
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(products);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    if (container) {
      container.innerHTML = '<p class="error">Failed to load new arrivals. Please try again shortly.</p>';
    }
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
  }
}

document.addEventListener('DOMContentLoaded', loadNewArrivals);
