const API_URL = 'http://localhost:3001/api';

async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    document.getElementById('product-container').innerHTML = 
      '<p class="error">Failed to load products. Please make sure the server is running.</p>';
  }
}

function displayProducts(products) {
  const container = document.getElementById('product-container');
  
  if (products.length === 0) {
    container.innerHTML = '<p>No products available.</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="card" data-category="${product.category || ''}">
      <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
      <h2>${product.name}</h2>
      <h3>৳${product.price} / ${product.unit || 'KG'}</h3>
      <p>${product.description || ''}</p>
      <button class="cart-btn" onclick="addToCart('${product.id}', '${product.name}', ${product.price})">
        Add to Cart
      </button>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', fetchProducts);
