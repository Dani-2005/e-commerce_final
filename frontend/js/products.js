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
      const card = document.createElement('div');
      card.className = 'producto';
      card.innerHTML = `
        <img src="/uploads/${producto.image}" alt="${producto.name}">
        <h2>${producto.name}</h2>
        <p>Categoría: ${producto.category_name}</p>
        <p>Sub-categoría: ${producto.subcategory_name}</p>
        <div class="precio">$${producto.price}</div>
        <button class="add-cart" data-id="${producto.product_id}">Agregar al carrito</button>
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

      const productToAdd = {
        id: producto.product_id,
        img: `/uploads/${producto.image}`,
        title: producto.name,
        price: producto.price,
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
