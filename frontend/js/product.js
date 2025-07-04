const recommendedModule = (() => {
  const container = document.getElementById('recommended-container');
  let categoryId = null;
  let subcategoryId = null;

  function init(catId, subcatId) {
    categoryId = catId;
    subcategoryId = subcatId;
    fetchRecommended();
  }

  function fetchAllProducts() {
    return fetch('http://localhost:3000/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener productos');
        return res.json();
      });
  }

  async function fetchRecommended() {
    if (!categoryId && !subcategoryId) {
      container.innerHTML = '<p>No hay recomendaciones disponibles.</p>';
      return;
    }

    try {
      const allProducts = await fetchAllProducts();

      const filtered = allProducts.filter(prod =>
        (categoryId && String(prod.category_id) === String(categoryId)) ||
        (subcategoryId && String(prod.subcategory_id) === String(subcategoryId))
      );

      // Limitar a 12 productos
      const recommended = filtered.slice(0, 12);

      renderRecommended(recommended);
    } catch (error) {
      container.innerHTML = '<p>Error al cargar recomendaciones.</p>';
      console.error('Error recomendaciones:', error);
    }
  }

  function renderRecommended(recommended) {
    const container = document.getElementById('recommended-container');
    if (!container) return;
    if (!recommended || recommended.length === 0) {
      container.innerHTML = "<p>No hay productos recomendados.</p>";
      return;
    }
    container.innerHTML = recommended.map(product => {
      // Verificar si todas las tallas están agotadas
      let agotado = false;
      if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        agotado = product.sizes.every(size => size.stock <= 0);
      } else if (typeof product.stock !== 'undefined') {
        agotado = product.stock <= 0;
      }

      return `
        <div class="recommended-product" data-id="${product.product_id}" style="cursor:pointer; position:relative;">
          <div style="position:relative;">
            <img src="/uploads/${product.image}" alt="${product.name}">
            ${agotado ? `<span class="agotado-parche" style="position:absolute;top:10px;left:10px;background:red;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;z-index:2;">AGOTADO</span>` : ''}
          </div>
          <h4>${product.name}</h4>
          <p>Categoría: ${product.category_name}</p>
          <p>Sub-categoría: ${product.subcategory_name}</p>
          <div class="precio">
            ${
              product.discount && product.discount > 0
                ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${product.price.toFixed(2)}</span>
                   <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>`
                : `<span style="color: black;">$${product.price.toFixed(2)}</span>`
            }
          </div>
          <button class="add-cart-recommended" data-id="${product.product_id}" ${agotado ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Agregar al carrito</button>
        </div>
      `;
    }).join("");

    // Evento para agregar al carrito
    container.querySelectorAll('.add-cart-recommended').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(button.getAttribute('data-id'));
        const product = recommended.find(p => p.product_id === id);
        if (product) {
          // Llama a la función expuesta desde productModule
          productModule.showProductPreview(product);
        }
      });
    });

    // Evento para redirigir al producto al hacer click en la tarjeta
    container.querySelectorAll('.recommended-product').forEach(card => {
      card.addEventListener('click', (e) => {
        // Si el click fue en el botón, no redirige (ya está controlado arriba)
        if (!e.target.classList.contains('add-cart-recommended')) {
          const id = card.getAttribute('data-id');
          window.location.href = `product.html?id=${id}`;
        }
      });
    });
  }

  return { init };
})();

// productModule: carga y muestra el producto actual
const productModule = (() => {
  let product = null;
  const contenedor = document.getElementById('producto');

  function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      fetchProductById(id);
    } else {
      contenedor.innerHTML = '<p>No se encontró el producto.</p>';
    }
  }

  function fetchProductById(id) {
    fetch(`http://localhost:3000/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        product = data;
        renderProduct();
        attachAddCartListener();
        recommendedModule.init(product.category_id, product.subcategory_id);
      })
      .catch(error => {
        contenedor.innerHTML = '<p>Error al obtener el producto.</p>';
        console.error('Error al obtener el producto:', error);
      });
  }



  function renderProduct() {
  if (!contenedor || !product) return;

  const imgDiv = contenedor.querySelector('.producto-img');
  const textDiv = contenedor.querySelector('.producto-text');

  let sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const sizeButtons = sizes.map((sizeObj, idx) => `
    <button type="button" class="size-btn" data-size="${sizeObj.name}" data-size-id="${sizeObj.size_id}" ${idx === 0 ? 'data-selected="true"' : ''}>
      ${sizeObj.name}
    </button>
    <span style="font-size:10px;color:#888;">(${sizeObj.stock} disponibles)</span>
  `).join('');

  // Verificar si todas las tallas están agotadas
  let agotado = false;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    agotado = product.sizes.every(size => size.stock <= 0);
  } else if (typeof product.stock !== 'undefined') {
    agotado = product.stock <= 0;
  }

  if (imgDiv && textDiv) {
    imgDiv.innerHTML = `
    <div style="position:relative;">
      <img src="/uploads/${product.image}" alt="${product.name}">
      ${agotado ? `<span class="agotado-parche" style="position:absolute;top:10px;left:10px;background:red;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;z-index:2;">AGOTADO</span>` : ''}
    </div>
  `;

    textDiv.innerHTML = `
  <h2>${product.name}</h2>
  <p>Categoría: ${product.category_name}</p>
  <p>Sub-categoría: ${product.subcategory_name}</p>
  <div class="precio">
    ${
      product.discount && product.discount > 0
        ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${product.price.toFixed(2)}</span>
           <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
           <span class="porcentaje-descuento" style="color: green; margin-left: 8px;">(-${product.discount}%)</span>`
        : `<span style="color: black;">$${product.price.toFixed(2)}</span>`
    }
  </div>
  <div class="size-selector">
    <span>Selecciona talla:</span>
    <div class="size-btns">${sizeButtons}</div>
  </div>
  <button class="add-cart" data-id="${product.product_id}">Agregar al carrito</button>
      
      <div class="info-resumida">
        <p><strong>Envío a:</strong> Venezuela</p>
        <p>🚚 Envío gratuito exprés para pedidos de más de $129.00<br>
        Entrega estimada es entre 12 a 15 días</p>
        <p>🔄 <strong>Política de devoluciones:</strong> Los artículos con venta final no se pueden devolver ni cambiar.</p>
        <p>🛡️ <strong>Seguridad en las compras:</strong> Pagos seguros · Transporte seguro · Servicio al cliente</p>
      </div>
    `;

    // Ahora que el HTML está cargado, seleccionamos los botones y agregamos el evento
    const btns = contenedor.querySelectorAll('.size-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.removeAttribute('data-selected'));
        btn.setAttribute('data-selected', 'true');
      });
    });
  }
}


  function attachAddCartListener() {
  const button = contenedor.querySelector('.add-cart');
  if (button) {
    button.addEventListener('click', () => {
      // Obtener el botón de talla seleccionado
      const selectedSizeBtn = contenedor.querySelector('.size-btn[data-selected="true"]');
      if (!selectedSizeBtn) {
        alert('Por favor selecciona una talla antes de agregar al carrito.');
        return;
      }
      const sizeIdRaw = selectedSizeBtn.getAttribute('data-size-id');
      const sizeId = sizeIdRaw !== null && sizeIdRaw !== '' ? parseInt(sizeIdRaw, 10) : null;
      if (sizeId === null || isNaN(sizeId)) {
        alert('Por favor selecciona una talla válida.');
        return;
      }

      // Validar stock
      const sizeObj = Array.isArray(product.sizes) ? product.sizes.find(s => s.id === sizeId || s.size_id === sizeId) : null;
      if (!sizeObj || sizeObj.stock <= 0) {
        alert('Esta talla no tiene stock disponible.');
        return;
      }

      const productToAdd = {
        id: product.product_id,
        img: `/uploads/${product.image}`,
        title: product.name,
        price: product.price,
        size_id: sizeId,
        size: selectedSizeBtn.textContent.trim(),
        quantity: 1
      };

      if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
        window.cartModule.addToCart(productToAdd);
      } else {
        console.warn('cartModule no está definido o no tiene addToCart');
      }
    });
  }
}


  const modal = document.createElement('div');
  modal.id = 'product-preview-modal';
  modal.classList.add('modal');
  modal.style.display = 'none';
  document.body.appendChild(modal);

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

  console.log('Tallas del producto:', producto.sizes);

  if (Array.isArray(producto.sizes) && producto.sizes.length > 0) {
      producto.sizes.forEach(sizeObj => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = `${sizeObj.name} (${sizeObj.stock} disponibles)`;

        if (typeof sizeObj.id !== 'undefined' && sizeObj.id !== null) {
          btn.dataset.sizeId = sizeObj.id;
        } else {
          console.warn('id indefinido para talla:', sizeObj);
          btn.dataset.sizeId = '';
        }

        btn.dataset.sizeName = sizeObj.name;
        btn.classList.add('size-btn'); // clase para botones de talla

        btn.addEventListener('click', () => {
          sizeOptionsDiv.querySelectorAll('button').forEach(b => {
            b.classList.remove('selected');
          });
          btn.classList.add('selected');
          console.log("Talla seleccionada:", btn.dataset.sizeName);
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
      size: selectedBtn.getAttribute('data-size-name'),
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


  return { 
    init,
    showProductPreview 
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  productModule.init();
});
