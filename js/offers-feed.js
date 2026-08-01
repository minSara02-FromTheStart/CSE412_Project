// offers-feed.js
// Loads only the products explicitly marked `onOffer: true` in Firestore
// (set from the admin panel), via a server-side query -- instead of
// downloading the whole "products" collection and filtering in the
// browser. Cheaper on Firestore reads and keeps working as the catalog
// grows past a handful of items.
//
// `onOffer` is intentionally its own field, separate from `flashSale`.
// A product can be on the everyday Offers page, in the timed Flash Sale,
// both, or neither -- the admin panel should expose two independent
// checkboxes rather than one shared "sale" badge.
//
// Dispatches "products:loaded" on `document` after rendering, same as
// products-feed.js, in case other scripts (search.js) want to hook in.

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderCard, renderEmptyState } from "./promoCard.js";

function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  if (products.length === 0) {
    renderEmptyState(container, {
      icon: '🏷️',
      title: 'No active offers right now',
      message: "We don't have any discounted products at the moment — check back soon, or browse the full catalog."
    });
    document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: [] } }));
    return;
  }

  container.innerHTML = products.map(product => {
    const discountHtml = product.discount
      ? `<span class="discount-badge">-${product.discount}%</span>`
      : '';
    return renderCard(product, { badgeHtml: discountHtml });
  }).join('');

  document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products } }));
}

async function loadOffers() {
  const container = document.getElementById('product-container');
  try {
    const offersQuery = query(collection(db, 'products'), where('onOffer', '==', true));
    const snap = await getDocs(offersQuery);
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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