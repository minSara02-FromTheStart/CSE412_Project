document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.querySelector('.product-container');
    const isProductsPage = window.location.pathname.endsWith('products.html');

    function getAllProducts() {
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
    if (initialQuery) {
        filterProducts(initialQuery);
    }

    const allProducts = getAllProducts();

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

                        if (productContainer) {
                            filterProducts(product.name, true);
                        } else if (!isProductsPage) {
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