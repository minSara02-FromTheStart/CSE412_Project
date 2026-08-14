// flashsale-feed.js
// Loads only products marked `flashSale: true` via a Firestore query, then
// drops any whose `flashSaleEnd` has already passed. That second check
// matters: without it, a product stays listed as a flash sale forever
// after the timer hits zero, until someone manually unchecks it in the
// admin panel. (Longer term, a scheduled Cloud Function that flips
// `flashSale` back to false at `flashSaleEnd` is the cleanest fix -- this
// client-side filter is the safety net for the time in between.)

// `flashSaleEnd` should be a Firestore Timestamp (or an ISO date string)
// set from the admin panel alongside the `flashSale` checkbox. If it's
// missing, the sale is treated as "today only" rather than indefinite.

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderCard, renderEmptyState } from "./promoCard.js?v=2";


function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}


/*
 * TEST HELPER 1
 * Parses feed items and extracts the expected fields.
 *
 * This function is NOT used by the existing website rendering flow,
 * so adding it does not change the current website behavior.
 */
export function parseFeedItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    flashSaleStart: item.flashSaleStart,
    flashSaleEnd: item.flashSaleEnd,
    discount: item.discount
  }));
}


/*
 * TEST HELPER 2
 * Validates required feed fields.
 *
 * Items without price, start date, or end date are skipped.
 * This function is used by the unit tests only.
 */
export function validateFeedItems(items) {
  if (!Array.isArray(items)) return [];

  return items.filter(item =>
    item &&
    item.price !== undefined &&
    item.price !== null &&
    item.flashSaleStart &&
    item.flashSaleEnd
  );
}


/*
 * TEST HELPER 3
 * Sorts products by flash-sale start date.
 * If two products have the same start date,
 * their end dates determine the order.
 *
 * This function is used by the unit tests only.
 */
export function sortByStartEndDates(items) {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    const startA = toDate(a.flashSaleStart)?.getTime() ?? Infinity;
    const startB = toDate(b.flashSaleStart)?.getTime() ?? Infinity;

    if (startA !== startB) {
      return startA - startB;
    }

    const endA = toDate(a.flashSaleEnd)?.getTime() ?? Infinity;
    const endB = toDate(b.flashSaleEnd)?.getTime() ?? Infinity;

    return endA - endB;
  });
}


/*
 * EXISTING WEBSITE FUNCTION
 *
 * Only change from the original is adding `export`.
 * The actual logic is unchanged.
 */
export function isStillRunning(product) {
  const end = toDate(product.flashSaleEnd);
  if (!end) return true; // no end set -> falls back to "today only" below
  return end.getTime() > Date.now();
}


function getEndTime(products) {
  const explicitEnds = products.map(p => toDate(p.flashSaleEnd)).filter(Boolean);

  if (explicitEnds.length > 0) {
    return new Date(
      Math.min(...explicitEnds.map(d => d.getTime()))
    );
  }

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

      // Re-query so expired items drop off the page without a manual
      // refresh -- otherwise the last render just sits there at 00:00:00.
      loadFlashSale();

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


function renderProducts(products) {
  const container = document.getElementById('product-container');
  if (!container) return;

  if (products.length === 0) {
    renderEmptyState(container, {
      icon: '⚡',
      title: 'No flash sale running right now',
      message:
        "There's no active flash sale at the moment — check back soon, or browse the full catalog."
    });

    document.dispatchEvent(
      new CustomEvent('products:loaded', {
        detail: { products: [] }
      })
    );

    return;
  }

  container.innerHTML = products
    .map(product => {
      const badgeHtml = product.discount
        ? `<span class="discount-badge">-${product.discount}%</span>`
        : `<span class="discount-badge">⚡ Flash</span>`;

      return renderCard(product, { badgeHtml });
    })
    .join('');

  document.dispatchEvent(
    new CustomEvent('products:loaded', {
      detail: { products }
    })
  );
}


async function loadFlashSale() {
  const container = document.getElementById('product-container');

  try {
    const flashQuery = query(
      collection(db, 'products'),
      where('flashSale', '==', true)
    );

    const snap = await getDocs(flashQuery);

    const products = snap.docs
      .map(d => ({
        id: d.id,
        ...d.data()
      }))
      .filter(isStillRunning);

    renderProducts(products);

    if (products.length > 0) {
      startCountdown(getEndTime(products));
    }

  } catch (error) {
    console.error(
      'Error fetching flash sale products:',
      error
    );

    if (container) {
      container.innerHTML =
        '<p class="error">Failed to load the flash sale. Please try again shortly.</p>';
    }

    document.dispatchEvent(
      new CustomEvent('products:loaded', {
        detail: { products: [] }
      })
    );
  }
}


document.addEventListener(
  'DOMContentLoaded',
  loadFlashSale
);