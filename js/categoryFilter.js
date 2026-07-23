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

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applyCategoryFilter, 300);
});