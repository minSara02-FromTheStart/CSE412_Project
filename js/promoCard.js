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
    desc,
    stock: Number(product.stock) || 0
  };
  return imgSrc;
}

// Below this stock level (but still > 0) the card shows a small
// "Only X left" nudge instead of nothing. Purely cosmetic -- doesn't
// affect whether the item can be bought.
const LOW_STOCK_THRESHOLD = 10;

// badgeHtml: the small overlay in the top corner of the image
// (discount %, "⚡ Flash", etc). Pass '' for none.
export function renderCard(product, { badgeHtml = '' } = {}) {
  const safeName = product.name.replace(/'/g, "\\'");
  const imgSrc = registerProduct(product);
  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;

  const ratingHtml = product.rating
    ? `<div class="rating">
         <span class="stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</span>
         <span class="rating-count">(${product.reviewCount || 0})</span>
       </div>`
    : '';

  const priceHtml = product.originalPrice
    ? `<h3>৳${product.price} <span style="text-decoration:line-through;color:var(--text-muted);font-weight:500;font-size:13px;">৳${product.originalPrice}</span></h3>`
    : `<h3>৳${product.price}</h3>`;

  const outOfStockBadge = outOfStock
    ? `<span class="product-badge" style="background:#6b7280;">Out of Stock</span>`
    : '';

  const lowStockHtml = (!outOfStock && stock <= LOW_STOCK_THRESHOLD)
    ? `<p style="margin:2px 0 0;font-size:12px;font-weight:600;color:#c0392b;">Only ${stock} left</p>`
    : '';

  const cartBtnHtml = outOfStock
    ? `<button class="cart-btn" type="button" disabled
         style="opacity:.55;cursor:not-allowed;background:#9ca3af;">
         Out of Stock
       </button>`
    : `<button class="cart-btn" type="button" onclick="addToCart('${product.id}', '${safeName}', ${product.price})">
         Add to Cart
       </button>`;

  return `
    <div class="card${outOfStock ? ' is-out-of-stock' : ''}" data-category="${product.category || ''}">
      <div class="card-media">
        ${badgeHtml}
        ${outOfStockBadge}
        <button class="wishlist-btn" type="button" data-id="${product.id}" aria-label="Add to favourites" onclick="NutriNestWishlist.toggleWishlist(window.__nutriProductsById['${product.id}'], this)">♥</button>
        <img src="${imgSrc}" alt="${product.name}" loading="lazy" style="${outOfStock ? 'opacity:.55;filter:grayscale(40%);' : ''}">
        <div class="quick-actions">
          <button class="quick-view-btn" type="button" onclick="openQuickView(window.__nutriProductsById['${product.id}'])">Quick View</button>
        </div>
      </div>
      <div class="card-body">
        <h2>${product.name}</h2>
        ${ratingHtml}
        ${lowStockHtml}
        <div class="card-footer">
          <div>
            ${priceHtml}
            <span class="unit">/ ${product.unit || 'KG'}</span>
          </div>
          ${cartBtnHtml}
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