const params = new URLSearchParams(window.location.search);
const query = params.get('query');

// --- MODAL PREVIEW LOGIC ---
let previewModal = document.getElementById('product-preview-modal');
if (!previewModal) {
  previewModal = document.createElement('div');
  previewModal.id = 'product-preview-modal';
  previewModal.classList.add('modal');
  previewModal.style.display = 'none';
  document.body.appendChild(previewModal);
}

function showProductPreview(product) {
  previewModal.innerHTML = ''; // limpiar contenido

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  modalContent.innerHTML = `
    <h2>${product.name}</h2>
    <img src="${product.image ? `/uploads/${product.image}` : '/default-product.png'}" alt="${product.name}">
    <p>Precio: $${product.price}</p>
    <div>
      <span>Selecciona talla:</span>
      <div id="size-options" class="size-options"></div>
    </div>
    <button id="add-to-cart-confirm" class="btn-confirm">Agregar al carrito</button>
    <button id="close-modal" class="close-btn">&times;</button>
  `;

  previewModal.appendChild(modalContent);
  previewModal.style.display = 'flex';

  const sizeOptionsDiv = modalContent.querySelector('#size-options');

  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    product.sizes.forEach(sizeObj => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${sizeObj.name} (${sizeObj.stock} disponibles)`;
      btn.dataset.sizeId = sizeObj.id ?? '';
      btn.dataset.sizeName = sizeObj.name;
      btn.classList.add('size-btn');
      btn.addEventListener('click', () => {
        sizeOptionsDiv.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      sizeOptionsDiv.appendChild(btn);
    });
  } else {
    sizeOptionsDiv.textContent = 'Sin tallas disponibles';
  }

  modalContent.querySelector('#close-modal').addEventListener('click', () => {
    previewModal.style.display = 'none';
  });

  modalContent.querySelector('#add-to-cart-confirm').addEventListener('click', () => {
    const selectedBtn = sizeOptionsDiv.querySelector('button.selected');
    if (!selectedBtn) {
      alert('Por favor selecciona una talla.');
      return;
    }
    const sizeIdRaw = selectedBtn.getAttribute('data-size-id');
    const sizeId = sizeIdRaw !== null && sizeIdRaw !== '' ? parseInt(sizeIdRaw, 10) : null;
    if (sizeId === null || isNaN(sizeId)) {
      alert('Por favor selecciona una talla válida.');
      return;
    }
    const productToAdd = {
      id: product.product_id,
      img: product.image ? `/uploads/${product.image}` : '/default-product.png',
      title: product.name,
      price: product.price,
      size_id: sizeId,
      size: selectedBtn.dataset.sizeName,
      quantity: 1
    };
    if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
      window.cartModule.addToCart(productToAdd);
      alert('Producto agregado al carrito');
      previewModal.style.display = 'none';
    } else {
      console.warn('cartModule no está definido o no tiene addToCart');
    }
  });
}
// --- FIN MODAL PREVIEW LOGIC ---

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
        <div class="precio">
          ${
            product.discount && product.discount > 0
              ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${product.price.toFixed(2)}</span>
                 <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>`
              : `<span style="color: black;">$${product.price.toFixed(2)}</span>`
          }
        </div>
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
                    showProductPreview(product);
                }
            });
        });
    }
})}