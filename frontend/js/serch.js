const params = new URLSearchParams(window.location.search);
const query = params.get('query');

if (query) {
    fetch(`/api/products/search/query?query=${encodeURIComponent(query)}`)
        .then(res => {
            if (!res.ok) throw new Error('Error en la respuesta del servidor');
            return res.text();
        })
        .then(text => {
    const resultsDiv = document.getElementById('results');
    if (!text) {
        resultsDiv.innerHTML = '<p>No se encontraron productos.</p>';
        return;
    }
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        resultsDiv.innerHTML = '<p>Error al procesar la respuesta.</p>';
        return;
    }
    if (!Array.isArray(data) || data.length === 0) {
        resultsDiv.innerHTML = '<p>No se encontraron productos.</p>';
    } else {
        resultsDiv.innerHTML = data.map(product =>
            `<div class="producto" data-product-id="${product.product_id}">
                <img src="${product.image ? `/uploads/${product.image}` : '/default-product.png'}" alt="${product.name}" class="product-img">
                <h3>${product.name}</h3>
                <p>Categoría: ${product.category_name || ''}</p>
                <p>Sub-categoría: ${product.subcategory_name || ''}</p>
                <div class="precio">$${product.price}</div>
                <button class="add-to-cart-btn" data-product-id="${product.product_id}">Agregar al carrito</button>
            </div>`
        ).join('');

        // Evento para redirigir al producto individual
        resultsDiv.querySelectorAll('.producto').forEach(card => {
            card.addEventListener('click', (e) => {
                // Evitar que el clic en el botón dispare la redirección
                if (!e.target.classList.contains('add-to-cart-btn')) {
                    const id = card.getAttribute('data-product-id');
                    window.location.href = `product.html?id=${id}`;
                }
            });
        });

        // Evento para agregar al carrito
        resultsDiv.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();

                const id = parseInt(button.getAttribute('data-product-id'));
                const product = data.find(p => p.product_id === id);
                if (product) {
                    if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
                        const productToAdd = {
                            id: product.product_id,
                            img: product.image ? `/uploads/${product.image}` : '/default-product.png',
                            title: product.name,
                            price: product.price
                        };
                        window.cartModule.addToCart(productToAdd);
                    } else {
                        console.warn('cartModule no está definido o no tiene addToCart');
                    }
                }
            });
        });
    }
})}