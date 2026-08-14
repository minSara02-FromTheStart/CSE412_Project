// reviews.js
// Product reviews, gated on purchase history. One review per customer per
// product (doc id `${uid}_${productId}`), so resubmitting edits it rather
// than creating a duplicate. Eligibility ("did this customer buy this
// product?") is checked against the `purchases` collection, which
// checkout.js writes to right after an order is placed.

import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

export function starHtml(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function fmtDate(ts) {
  const d = ts && typeof ts.toDate === "function" ? ts.toDate() : new Date(ts || Date.now());
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function hasPurchased(uid, productId) {
  if (!uid || !productId) return false;
  try {
    const snap = await getDoc(doc(db, "purchases", `${uid}_${productId}`));
    return snap.exists();
  } catch (err) {
    console.error("Purchase check failed:", err);
    return false;
  }
}

export async function getMyReview(uid, productId) {
  if (!uid || !productId) return null;
  try {
    const snap = await getDoc(doc(db, "reviews", `${uid}_${productId}`));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Fetch my review failed:", err);
    return null;
  }
}

export async function loadReviews(productId) {
  try {
    // No orderBy here on purpose -- a where() + orderBy() on different
    // fields needs a composite index created in the Firebase console
    // first, which silently breaks this query (for every user, not just
    // guests) until that index exists. Sorting client-side instead avoids
    // that requirement entirely.
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("productId", "==", productId)
    );
    const snap = await getDocs(reviewsQuery);
    const reviews = snap.docs.map(d => d.data());
    reviews.sort((a, b) => {
      const aTime = a.createdAt && typeof a.createdAt.toMillis === "function" ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt && typeof b.createdAt.toMillis === "function" ? b.createdAt.toMillis() : 0;
      return bTime - aTime; // newest first
    });
    return reviews;
  } catch (err) {
    console.error("Load reviews failed:", err);
    return [];
  }
}

export async function submitReview(uid, customerName, productId, rating, comment) {
  const trimmedComment = (comment || "").trim();
  const numericRating = Number(rating);

  if (!trimmedComment) throw new Error("Please write a comment.");
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    throw new Error("Please choose a rating from 1 to 5.");
  }

  await setDoc(doc(db, "reviews", `${uid}_${productId}`), {
    uid,
    productId,
    customerName: customerName || "NutriNest Customer",
    rating: numericRating,
    comment: trimmedComment,
    createdAt: serverTimestamp()
  }, { merge: true });
}

export async function deleteReview(uid, productId) {
  await deleteDoc(doc(db, "reviews", `${uid}_${productId}`));
}

export function renderReviewsList(reviews) {
  if (!reviews.length) {
    return `<p style="color:#6b7280;font-size:13px;margin:6px 0 0;">No reviews yet. Be the first to share your feedback!</p>`;
  }

  return reviews.map(r => `
    <div style="border-top:1px solid #e5e7eb;padding:10px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong style="font-size:13px;">${escapeHTML(r.customerName)}</strong>
        <span style="color:#f59e0b;font-size:13px;">${starHtml(r.rating)}</span>
      </div>
      <p style="margin:4px 0 0;font-size:13px;color:#374151;">${escapeHTML(r.comment)}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${fmtDate(r.createdAt)}</p>
    </div>
  `).join('');
}