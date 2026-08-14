// quickview.js
// Opens a lightweight modal with product details, without navigating
// away from the product grid. Shared by index.html and products.html.
// Expects a #quickViewOverlay element to already exist in the page markup.
//
// NOTE: this is now a module (needs type="module" on its <script> tag)
// so it can talk to Firebase Auth/Firestore for the reviews section below.
// openQuickView/closeQuickView are still exposed on window for the
// inline onclick="" handlers in promoCard.js.

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  hasPurchased,
  getMyReview,
  loadReviews,
  submitReview,
  renderReviewsList,
  starHtml
} from "./reviews.js";

let currentUser = null;
let currentUserName = "";

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  if (user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      currentUserName = snap.exists() ? (snap.data().fullName || "") : "";
    } catch {
      currentUserName = "";
    }
  } else {
    currentUserName = "";
  }
});

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

          <div style="margin-top:8px;padding-top:14px;border-top:1px solid #e5e7eb;">
            <h4 style="margin:0 0 8px;font-size:14px;">
              Customer Reviews <span id="qvReviewCount" style="font-weight:400;color:#6b7280;font-size:12px;"></span>
            </h4>
            <div id="qvReviewsList"><p style="font-size:13px;color:#6b7280;">Loading reviews...</p></div>
            <div id="qvReviewFormWrap" style="margin-top:12px;"></div>
          </div>
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

  // ===================== REVIEWS =====================

  function ratingSelectHtml(selected) {
    let options = '';
    for (let i = 5; i >= 1; i--) {
      options += `<option value="${i}" ${Number(selected) === i ? 'selected' : ''}>${starHtml(i)} (${i})</option>`;
    }
    return `<select id="qvRatingSelect" style="padding:8px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;">${options}</select>`;
  }

  function renderReviewForm(overlay, product, existingReview) {
    const wrap = overlay.querySelector('#qvReviewFormWrap');

    if (!currentUser) {
      wrap.innerHTML = `<p style="font-size:12px;color:#6b7280;">Log in to write a review.</p>`;
      return;
    }

    wrap.innerHTML = `<p style="font-size:12px;color:#6b7280;">Checking purchase history...</p>`;

    hasPurchased(currentUser.uid, product.id).then(purchased => {
      if (!purchased) {
        wrap.innerHTML = `<p style="font-size:12px;color:#6b7280;">Only customers who've purchased this product can leave a review.</p>`;
        return;
      }

      wrap.innerHTML = `
        <p style="font-size:13px;font-weight:600;margin:0 0 6px;">
          ${existingReview ? 'Edit your review' : 'Write a review'}
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${ratingSelectHtml(existingReview ? existingReview.rating : 5)}
          <textarea id="qvCommentInput" rows="3" placeholder="Share your experience with this product..."
            style="padding:8px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;resize:vertical;">${existingReview ? existingReview.comment : ''}</textarea>
          <button id="qvSubmitReviewBtn" type="button" class="cart-btn" style="align-self:flex-start;">
            ${existingReview ? 'Update Review' : 'Submit Review'}
          </button>
          <p id="qvReviewMsg" style="font-size:12px;margin:0;"></p>
        </div>
      `;

      wrap.querySelector('#qvSubmitReviewBtn').addEventListener('click', async () => {
        const btn = wrap.querySelector('#qvSubmitReviewBtn');
        const msg = wrap.querySelector('#qvReviewMsg');
        const rating = wrap.querySelector('#qvRatingSelect').value;
        const comment = wrap.querySelector('#qvCommentInput').value;

        btn.disabled = true;
        btn.textContent = 'Saving...';
        msg.textContent = '';

        try {
          await submitReview(currentUser.uid, currentUserName, product.id, rating, comment);
          msg.style.color = '#0f7a3d';
          msg.textContent = 'Thanks! Your review has been posted.';
          await refreshReviewsList(overlay, product.id);
        } catch (err) {
          msg.style.color = '#c0392b';
          msg.textContent = err.message || 'Could not save your review.';
        } finally {
          btn.disabled = false;
          btn.textContent = existingReview ? 'Update Review' : 'Submit Review';
        }
      });
    });
  }

  async function refreshReviewsList(overlay, productId) {
    const listEl = overlay.querySelector('#qvReviewsList');
    const countEl = overlay.querySelector('#qvReviewCount');
    const reviews = await loadReviews(productId);

    countEl.textContent = reviews.length ? `(${reviews.length})` : '';
    listEl.innerHTML = renderReviewsList(reviews);
  }

  async function loadReviewsSection(overlay, product) {
    await refreshReviewsList(overlay, product.id);

    // Reviews list itself is public (guests included) -- only the
    // write-a-review form is gated on being logged in + having purchased.
    const existingReview = currentUser ? await getMyReview(currentUser.uid, product.id) : null;
    renderReviewForm(overlay, product, existingReview);
  }

  // ===================== EXISTING QUICK VIEW LOGIC (unchanged) =====================

  function openQuickView(product) {
    if (!product) return;
    const overlay = ensureModal();
    const stock = Number(product.stock) || 0;
    const outOfStock = stock <= 0;

    overlay.querySelector('#qvImage').src = product.image || 'https://via.placeholder.com/300';
    overlay.querySelector('#qvImage').alt = product.name;
    overlay.querySelector('#qvTitle').textContent = product.name;
    overlay.querySelector('#qvPrice').textContent = `৳${product.price} / ${product.unit || 'KG'}`;
    overlay.querySelector('#qvDesc').textContent = product.desc || 'No description available.';

    const addBtn = overlay.querySelector('#qvAddBtn');
    addBtn.disabled = outOfStock;
    addBtn.textContent = outOfStock ? 'Out of Stock' : 'Add to Cart';
    addBtn.style.opacity = outOfStock ? '.55' : '';
    addBtn.style.cursor = outOfStock ? 'not-allowed' : '';
    addBtn.style.background = outOfStock ? '#9ca3af' : '';
    addBtn.onclick = () => {
      if (outOfStock) return;
      if (typeof addToCart === 'function') {
        addToCart(
          product.id,
          product.name,
          product.price
        );
      }
      closeQuickView();
    };

    overlay.querySelector('#qvReviewsList').innerHTML = `<p style="font-size:13px;color:#6b7280;">Loading reviews...</p>`;
    overlay.querySelector('#qvReviewFormWrap').innerHTML = '';
    loadReviewsSection(overlay, product);

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