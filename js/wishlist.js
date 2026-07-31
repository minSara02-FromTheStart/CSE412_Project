// wishlist.js
// Customer-only favourites backed by Firestore.
//
// Favourites are stored on each Firebase user document at:
// users/{customerUid}.favourites

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let currentRole = null;
let roleLoadedForUid = null;
let currentUserData = {};
let cachedWishlist = [];
let cacheLoadedForUid = null;

let resolveAuthReady;
let authReadyResolved = false;
const authReady = new Promise(resolve => {
  resolveAuthReady = resolve;
});

function markAuthReady() {
  if (authReadyResolved) return;
  authReadyResolved = true;
  resolveAuthReady();
}

function dispatchWishlistChanged() {
  document.dispatchEvent(new CustomEvent("wishlist:changed", {
    detail: { list: cachedWishlist }
  }));
}

function normaliseProduct(product) {
  if (!product || !product.id) return null;

  return {
    id: String(product.id),
    productId: String(product.id),
    name: product.name || "Product",
    price: Number(product.price) || 0,
    unit: product.unit || "KG",
    image: product.image || "https://via.placeholder.com/300",
    desc: product.desc || product.description || ""
  };
}

async function loadCurrentRole() {
  if (!currentUser) return null;
  if (roleLoadedForUid === currentUser.uid) return currentRole;

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  currentUserData = userDoc.exists() ? userDoc.data() : {};
  currentRole = currentUserData.role || "Customer";
  roleLoadedForUid = currentUser.uid;
  return currentRole;
}

function sendToLogin() {
  alert("Please log in as a customer to save favourites.");
  window.location.href = "login.html";
}

async function requireCustomer(options = {}) {
  const { redirect = false, notify = false } = options;
  await authReady;

  if (!currentUser) {
    if (redirect) sendToLogin();
    return null;
  }

  const role = await loadCurrentRole();
  if (role !== "Customer") {
    if (notify) alert("Only customer accounts can save favourite products.");
    return null;
  }

  return currentUser;
}

async function loadWishlistForUser(user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  currentUserData = userDoc.exists() ? userDoc.data() : {};
  currentRole = currentUserData.role || "Customer";
  roleLoadedForUid = user.uid;
  cachedWishlist = Array.isArray(currentUserData.favourites)
    ? currentUserData.favourites
    : [];
  cacheLoadedForUid = user.uid;
  return cachedWishlist;
}

async function saveWishlistForUser(user, list) {
  await setDoc(doc(db, "users", user.uid), {
    favourites: list,
    favouritesUpdatedAt: serverTimestamp()
  }, { merge: true });

  cachedWishlist = list;
  cacheLoadedForUid = user.uid;
}

async function getWishlist() {
  const user = await requireCustomer();
  if (!user) {
    cachedWishlist = [];
    cacheLoadedForUid = null;
    syncWishlistButtons();
    return [];
  }

  if (cacheLoadedForUid !== user.uid) {
    try {
      await loadWishlistForUser(user);
    } catch (error) {
      console.error("Could not load favourites:", error);
      cachedWishlist = [];
    }
  }

  syncWishlistButtons();
  return cachedWishlist;
}

function isInWishlist(id) {
  return cachedWishlist.some(product => product.id === id || product.productId === id);
}

async function toggleWishlist(product, button) {
  const favourite = normaliseProduct(product);
  if (!favourite) return false;

  if (button) button.disabled = true;

  try {
    const user = await requireCustomer({ redirect: true, notify: true });
    if (!user) return false;

    if (cacheLoadedForUid !== user.uid) {
      await loadWishlistForUser(user);
    }

    if (isInWishlist(favourite.id)) {
      const nextWishlist = cachedWishlist.filter(item => item.id !== favourite.id && item.productId !== favourite.id);
      await saveWishlistForUser(user, nextWishlist);
      dispatchWishlistChanged();
      syncWishlistButtons();
      return false;
    }

    await saveWishlistForUser(user, [...cachedWishlist, {
      ...favourite,
      savedAt: new Date().toISOString()
    }]);
    dispatchWishlistChanged();
    syncWishlistButtons();
    return true;
  } catch (error) {
    console.error("Could not update favourites:", error);
    alert("Could not update favourites. Please try again.");
    syncWishlistButtons();
    return isInWishlist(favourite.id);
  } finally {
    if (button) button.disabled = false;
  }
}

async function removeFromWishlist(id) {
  const productId = String(id || "");
  if (!productId) return;

  const user = await requireCustomer({ redirect: true, notify: true });
  if (!user) return;

  try {
    const nextWishlist = cachedWishlist.filter(item => item.id !== productId && item.productId !== productId);
    await saveWishlistForUser(user, nextWishlist);
    dispatchWishlistChanged();
    syncWishlistButtons();
  } catch (error) {
    console.error("Could not remove favourite:", error);
    alert("Could not remove this favourite. Please try again.");
  }
}

async function isSignedInCustomer() {
  try {
    return Boolean(await requireCustomer());
  } catch (error) {
    console.warn("Could not verify customer account:", error);
    return false;
  }
}

function syncWishlistButtons() {
  document.querySelectorAll(".wishlist-btn[data-id]").forEach(button => {
    const active = isInWishlist(button.dataset.id);
    button.classList.toggle("active", active);
    button.setAttribute("aria-label", active ? "Remove from favourites" : "Add to favourites");
  });
}

window.NutriNestWishlist = {
  getWishlist,
  toggleWishlist,
  isInWishlist,
  removeFromWishlist,
  syncWishlistButtons,
  isSignedInCustomer
};

onAuthStateChanged(auth, async user => {
  currentUser = user;
  currentRole = null;
  roleLoadedForUid = null;
  currentUserData = {};
  cachedWishlist = [];
  cacheLoadedForUid = null;

  if (user) {
    try {
      const role = await loadCurrentRole();
      if (role === "Customer") {
        await loadWishlistForUser(user);
      }
    } catch (error) {
      console.warn("Could not prepare favourites:", error);
    }
  }

  markAuthReady();
  dispatchWishlistChanged();
  syncWishlistButtons();
});

document.addEventListener("DOMContentLoaded", () => {
  syncWishlistButtons();
  getWishlist().catch(error => console.warn("Could not initialise favourites:", error));
});
document.addEventListener("products:loaded", syncWishlistButtons);
