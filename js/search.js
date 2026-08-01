document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.querySelector('.product-container');
    const isProductsPage = window.location.pathname.endsWith('products.html');

    let allProducts = [];

    // Fallback only, for pages with static cards and no products-feed.js
    // (i.e. products:loaded never fires, so this is all we have).
    function getAllProductsFromDOM() {
        if (!productContainer) return [];
        return Array.from(productContainer.querySelectorAll('.card')).map(card => {
            const nameEl = card.querySelector('h2');
            const priceEl = card.querySelector('h3');
            const imgEl = card.querySelector('img');
            return {
                name: nameEl ? nameEl.textContent.trim() : '',
                price: priceEl ? priceEl.textContent.trim() : '',
                image: imgEl ? imgEl.src : ''
            };
        });
    }

    function fmtPrice(product) {
        return typeof product.price === 'number'
            ? `৳${product.price} / ${product.unit || 'KG'}`
            : (product.price || '');
    }

    function filterProducts(query, exact = false) {
        if (!productContainer) return;
        const q = query.trim().toLowerCase();

        productContainer.querySelectorAll('.card').forEach(card => {
            const nameEl = card.querySelector('h2');
            const name = nameEl ? nameEl.textContent.trim().toLowerCase() : '';
            const match = exact ? (name === q) : (q === '' || name.includes(q));
            card.style.display = match ? '' : 'none';
        });
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('search') || '';

    // Cards may be static (already in the HTML) or loaded dynamically from
    // Firestore by products-feed.js. When dynamic, products-feed.js hands us
    // the FULL catalog via event.detail.products -- not just whatever subset
    // got rendered into the DOM. This matters because pages like the
    // homepage cap rendering to a handful of cards (data-limit="4"), but a
    // customer typing in the search box still expects to find every product,
    // not just the ones currently on screen.
    document.addEventListener('products:loaded', (e) => {
        const products = (e.detail && e.detail.products) || [];
        allProducts = products.length
            ? products.map(p => ({
                name: p.name || '',
                price: fmtPrice(p),
                image: p.image || 'https://via.placeholder.com/300'
              }))
            : getAllProductsFromDOM();
        if (initialQuery) filterProducts(initialQuery);
    });

    // Fallback for pages with static cards and no products-feed.js at all
    // (products:loaded will simply never fire on those pages).
    allProducts = getAllProductsFromDOM();
    if (initialQuery) filterProducts(initialQuery);

    document.querySelectorAll('form.search-box, form.nav-search-box').forEach(form => {
        const input = form.querySelector('input[name="search"]');
        if (!input) return;

        if (initialQuery) input.value = initialQuery;

        // Appended to <body> (not the form) and positioned "fixed" relative
        // to the viewport, so it can never get clipped by a parent section's
        // overflow:hidden (like the hero), and never runs off the screen.
        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'search-suggestions';
        suggestionsBox.hidden = true;
        document.body.appendChild(suggestionsBox);

        function positionDropdown() {
            const rect = input.getBoundingClientRect();
            const margin = 12;
            const availableHeight = window.innerHeight - rect.bottom - margin;

            suggestionsBox.style.left = rect.left + 'px';
            suggestionsBox.style.top = (rect.bottom + 6) + 'px';
            suggestionsBox.style.width = rect.width + 'px';
            suggestionsBox.style.maxHeight = Math.max(100, Math.min(320, availableHeight)) + 'px';
        }

        function closeSuggestions() {
            suggestionsBox.hidden = true;
            suggestionsBox.innerHTML = '';
        }

        function showSuggestions(query) {
            const q = query.trim().toLowerCase();
            suggestionsBox.innerHTML = '';

            if (q === '') {
                closeSuggestions();
                return;
            }

            const matches = allProducts.filter(p => p.name.toLowerCase().includes(q));

            if (matches.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'search-suggestion-empty';
                empty.textContent = 'No products found';
                suggestionsBox.appendChild(empty);
            } else {
                matches.forEach(product => {
                    const item = document.createElement('div');
                    item.className = 'search-suggestion-item';
                    item.innerHTML = `
                        <img src="${product.image}" alt="${product.name}">
                        <div class="suggestion-info">
                            <span class="suggestion-name">${product.name}</span>
                            <span class="suggestion-price">${product.price}</span>
                        </div>
                    `;

                    item.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        input.value = product.name;
                        closeSuggestions();

                        // products.html renders the full, uncapped catalog, so
                        // filtering in place is safe there. Everywhere else
                        // (e.g. the homepage's capped 4-card grid), the chosen
                        // product may not even be in the DOM -- filtering in
                        // place would just hide every card with nothing to
                        // show. Send them to the full listing instead.
                        if (isProductsPage && productContainer) {
                            filterProducts(product.name, true);
                        } else {
                            window.location.href = `products.html?search=${encodeURIComponent(product.name)}`;
                        }
                    });

                    suggestionsBox.appendChild(item);
                });
            }

            positionDropdown();
            suggestionsBox.hidden = false;
        }

        input.addEventListener('input', () => {
            filterProducts(input.value);
            showSuggestions(input.value);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim() !== '') showSuggestions(input.value);
        });

        document.addEventListener('click', (e) => {
            if (!form.contains(e.target) && !suggestionsBox.contains(e.target)) {
                closeSuggestions();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSuggestions();
        });

        // Keep the dropdown glued to the input if the page scrolls or resizes
        window.addEventListener('scroll', () => {
            if (!suggestionsBox.hidden) positionDropdown();
        }, true);
        window.addEventListener('resize', () => {
            if (!suggestionsBox.hidden) positionDropdown();
        });

        form.addEventListener('submit', (e) => {
            if (isProductsPage && productContainer) {
                e.preventDefault();
                filterProducts(input.value);
            }
            closeSuggestions();
        });
    });
});