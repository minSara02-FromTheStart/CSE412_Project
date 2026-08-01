// promoCard.js
// Shared card renderer + product registry used by offers-feed.js and
// flashsale-feed.js (and reusable by products-feed.js) so every page
// produces identical markup instead of three copies that can drift apart.

export function registerProduct(product) {
  window.__nutriProductsById = window.__nutriProductsById || {};
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
  return imgSrc;
}

// badgeHtml: the small overlay in the top corner of the image
// (discount %, "⚡ Flash", etc). Pass '' for none.
export function renderCard(product, { badgeHtml = '' } = {}) {
  const safeName = product.name.replace(/'/g, "\\'");
  const imgSrc = registerProduct(product);

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
        ${badgeHtml}
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
}

export function renderEmptyState(container, { icon, title, message }) {
  if (!container) return;
  container.innerHTML = `
    <div class="promo-empty">
      <span class="promo-empty-icon">${icon}</span>
      <h3>${title}</h3>
      <p>${message}</p>
      <a class="explore-btn" href="products.html">Browse All Products</a>
    </div>
  `;
}