const productsModule = (() => {
  let products = [];

  const contenedor = document.getElementById('productos');

  // Crear un modal básico para vista previa
  const modal = document.createElement('div');
  modal.id = 'product-preview-modal';
  modal.classList.add('modal'); // clase para el modal (fondo)
  modal.style.display = 'none';
  document.body.appendChild(modal);

  function init() {
    fetchProducts();
  }

  function fetchProducts() {
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';

    const urlParams = new URLSearchParams(window.location.search);
    const apiParams = new URLSearchParams();

    ['category_id', 'subcategory_id'].forEach(param => {
      if (urlParams.has(param)) {
        apiParams.append(param, urlParams.get(param));
      }
    });

    const apiUrl = `http://localhost:3000/api/products?${apiParams.toString()}`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        products = data;
        renderProducts();
        attachAddCartListeners();
      })
      .catch(error => {
        console.error('Error al obtener los productos:', error);
        contenedor.innerHTML = '<p class="error">Error al cargar los productos. Intenta nuevamente.</p>';
      });
  }

  function renderProducts() {
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (products.length === 0) {
    contenedor.innerHTML = '<p class="no-results">No se encontraron productos en esta categoría.</p>';
    return;
  }

  products.forEach(producto => {
    const tieneDescuento = producto.discount && producto.discount > 0;
    const precioOriginal = producto.price.toFixed(2);
    const precioConDescuento = tieneDescuento
      ? (producto.price * (1 - producto.discount / 100)).toFixed(2)
      : precioOriginal;

    // Verificar si todas las tallas están agotadas
    let agotado = false;
    if (Array.isArray(producto.sizes) && producto.sizes.length > 0) {
      agotado = producto.sizes.every(size => size.stock <= 0);
    } else if (typeof producto.stock !== 'undefined') {
      agotado = producto.stock <= 0;
    }

    const card = document.createElement('div');
    card.className = 'producto';

    card.innerHTML = `
      <div class="img-container" style="position:relative;">
        <img src="/uploads/${producto.image}" alt="${producto.name}">
        ${agotado ? `<span class="agotado-parche" style="position:absolute;top:10px;left:10px;background:red;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;z-index:2;">AGOTADO</span>` : ''}
      </div>
      <h2>${producto.name}</h2>
      <p>Categoría: ${producto.category_name}</p>
      <p>Sub-categoría: ${producto.subcategory_name}</p>
      <div class="precio">
        ${tieneDescuento
          ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${precioOriginal}</span>
             <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${precioConDescuento}</span>`
          : `<span style="color: black;">$${precioOriginal}</span>`
        }
      </div>
      <button class="add-cart" data-id="${producto.product_id}" ${agotado ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Agregar al carrito</button>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('add-cart')) {
        window.location.href = `product.html?id=${producto.product_id}`;
      }
    });

    contenedor.appendChild(card);
  });
}


  function attachAddCartListeners() {
    const buttons = contenedor.querySelectorAll('.add-cart');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.getAttribute('data-id'));
        const producto = products.find(p => p.product_id === id);
        if (producto) {
          showProductPreview(producto);
        }
      });
    });
  }

  // Función para mostrar modal con vista previa y selección de talla
  function showProductPreview(producto) {
    modal.innerHTML = ''; // limpiar contenido

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content'); // clase para contenido modal

    modalContent.innerHTML = `
      <h2>${producto.name}</h2>
      <img src="/uploads/${producto.image}" alt="${producto.name}">
      <div class="precio">
        ${
          producto.discount && producto.discount > 0
            ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${producto.price.toFixed(2)}</span>
              <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${(producto.price * (1 - producto.discount / 100)).toFixed(2)}</span>
              <span class="porcentaje-descuento" style="color: green; margin-left: 8px;">(-${producto.discount}%)</span>`
            : `<span style="color: black;">$${producto.price.toFixed(2)}</span>`
        }
      </div>
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
      console.log("Botón seleccionado al confirmar:", selectedBtn);

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
      
      // Validar stock
      const sizeObj = producto.sizes.find(s => s.id === sizeId);
      if (!sizeObj || sizeObj.stock <= 0) {
        alert('Esta talla no tiene stock disponible.');
        return;
      }
    
      const tieneDescuento = producto.discount && producto.discount > 0;
      const precioFinal = tieneDescuento 
        ? (producto.price * (1 - producto.discount / 100)).toFixed(2)
        : producto.price.toFixed(2);

      const productToAdd = {
        id: producto.product_id,
        img: `/uploads/${producto.image}`,
        title: producto.name,
        price: parseFloat(precioFinal),  // Usa el precio con descuento si aplica
        originalPrice: producto.price,   // Opcional: precio original para mostrar
        discount: producto.discount || 0,
        size_id: sizeId,
        size: selectedBtn.dataset.sizeName,
        quantity: 1
      };


      console.log('Producto a agregar:', productToAdd);

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
    init
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  productsModule.init();
});
