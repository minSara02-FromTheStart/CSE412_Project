const params = new URLSearchParams(window.location.search);
const category = params.get('category');

function applyCategoryFilter() {
  if (!category) return;

  document.querySelectorAll('.card').forEach(card => {
    const cardCategories = (card.dataset.category || '').split(' ');
    if (!cardCategories.includes(category)) {
      card.style.display = 'none';
    }
  });
}

// If products are loaded dynamically from Firestore (products-feed.js), the
// cards don't exist yet at DOMContentLoaded -- wait for the event it fires
// once rendering is done. If products-feed.js isn't on this page at all
// (e.g. a page with static cards), fall back to running on DOMContentLoaded.
let ranAfterLoad = false;

document.addEventListener('products:loaded', () => {
  ranAfterLoad = true;
  applyCategoryFilter();
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!ranAfterLoad) applyCategoryFilter();
  }, 300);
});
