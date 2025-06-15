// --- MODAL GLOBAL ---
const modal = document.createElement('div');
modal.id = 'product-preview-modal';
modal.classList.add('modal');
modal.style.display = 'none';
document.body.appendChild(modal);

// --- FUNCIÓN GLOBAL ---
function showProductPreview(producto) {
  modal.innerHTML = '';

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  modalContent.innerHTML = `
    <h2>${producto.name}</h2>
    <img src="/uploads/${producto.image}" alt="${producto.name}">
    <p>Precio: $${producto.price}</p>
    <div>
      <span>Selecciona talla:</span>
      <div id="size-options" class="size-options"></div>
    </div>
    <button id="add-to-cart-confirm" class="btn-confirm">Agregar al carrito</button>
    <button id="close-modal" class="close-btn">&times;</button>
  `;

  modal.appendChild(modalContent);
  modal.style.display = 'flex';

  const sizeOptionsDiv = modalContent.querySelector('#size-options');

  if (Array.isArray(producto.sizes) && producto.sizes.length > 0) {
    producto.sizes.forEach(sizeObj => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${sizeObj.name} (${sizeObj.stock} disponibles)`;

      if (typeof sizeObj.size_id !== 'undefined' && sizeObj.size_id !== null) {
        btn.dataset.sizeId = sizeObj.size_id;
      } else {
        btn.dataset.sizeId = '';
      }

      btn.dataset.sizeName = sizeObj.name;
      btn.classList.add('size-btn');

      btn.addEventListener('click', () => {
        sizeOptionsDiv.querySelectorAll('button').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
      });

      sizeOptionsDiv.appendChild(btn);
    });
  } else {
    sizeOptionsDiv.textContent = 'Sin tallas disponibles';
  }

  modalContent.querySelector('#close-modal').addEventListener('click', () => {
    modal.style.display = 'none';
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
      id: producto.product_id,
      img: `/uploads/${producto.image}`,
      title: producto.name,
      price: producto.price,
      size_id: sizeId,
      size: selectedBtn.dataset.sizeName,
      quantity: 1
    };

    if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
      window.cartModule.addToCart(productToAdd);
      alert('Producto agregado al carrito');
      modal.style.display = 'none';
    } else {
      console.warn('cartModule no está definido o no tiene addToCart');
    }
  });
}