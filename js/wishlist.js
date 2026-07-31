// wishlist.js
// Small shared wishlist ("Favourites") utility, used by index.html,
// products.html, and favourites.html. Stores a snapshot of each favourited
// product in localStorage so favourites.html can render the saved items
// without needing another Firestore call.
//
// Note: prices/descriptions shown on the Favourites page reflect the
// product as it was when it was favourited, and won't update if the
// product changes later in the catalog. That's an acceptable tradeoff
// for keeping favourites.html simple and independent of Firebase.

(function () {
  const STORAGE_KEY = 'nutrinest_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { list } }));
  }

  function isInWishlist(id) {
    return getWishlist().some(p => p.id === id);
  }

  // Adds the product if not already saved, removes it if it is.
  // Returns true if the product is now in the wishlist, false if removed.
  function toggleWishlist(product) {
    if (!product || !product.id) return false;
    const list = getWishlist();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx > -1) {
      list.splice(idx, 1);
      saveWishlist(list);
      return false;
    }
    list.push(product);
    saveWishlist(list);
    return true;
  }

  function removeFromWishlist(id) {
    const list = getWishlist().filter(p => p.id !== id);
    saveWishlist(list);
  }

  // Keeps heart-icon buttons in sync with saved state. Any card marked
  // with class="wishlist-btn" and a data-id attribute gets its "active"
  // class toggled to match localStorage. Safe to call anytime.
  function syncWishlistButtons() {
    document.querySelectorAll('.wishlist-btn[data-id]').forEach(btn => {
      btn.classList.toggle('active', isInWishlist(btn.dataset.id));
    });
  }

  window.NutriNestWishlist = {
    getWishlist,
    toggleWishlist,
    isInWishlist,
    removeFromWishlist,
    syncWishlistButtons
  };

  document.addEventListener('DOMContentLoaded', syncWishlistButtons);
  document.addEventListener('products:loaded', syncWishlistButtons);
  document.addEventListener('wishlist:changed', syncWishlistButtons);
})();