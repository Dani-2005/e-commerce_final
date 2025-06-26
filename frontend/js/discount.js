let mostSoldProducts = [];
let mostSoldPage = 0;
const productsPerPage = 5;

// Crear un modal básico para vista previa (igual que en paste.txt)
const modal = document.createElement('div');
modal.id = 'product-preview-modal';
modal.classList.add('modal');
modal.style.display = 'none';
document.body.appendChild(modal);

function renderMostSoldProductsPage() {
  const container = document.getElementById('most-sold');
  container.innerHTML = '';
  const start = mostSoldPage * productsPerPage;
  const end = start + productsPerPage;
  const pageProducts = mostSoldProducts.slice(start, end);

  pageProducts.forEach(prod => {
    const tieneDescuento = prod.discount && prod.discount > 0;
    const precioConDescuento = (prod.price * (1 - prod.discount / 100)).toFixed(2);
    container.innerHTML += `
      <div class="product-card" data-id="${prod.product_id}">
        <img src="/uploads/${prod.image}" alt="${prod.name}" />
        <h3>${prod.name}</h3>
        <div class="precio">
          ${tieneDescuento
            ? `<span class="precio-original" style="text-decoration: line-through; color: black;">$${prod.price.toFixed(2)}</span>
               <span class="precio-descuento" style="color: red; font-weight: bold; margin-left: 8px;">$${precioConDescuento}</span>`
            : `<span style="color: black;">$${prod.price.toFixed(2)}</span>`
          }
        </div>
        <p>Vendidos esta semana: ${prod.total_vendidos}</p>
        <button class="add-cart" data-id="${prod.product_id}">Agregar al carrito</button>
      </div>
    `;
  });

  // Asignar eventos de click a las tarjetas
  container.querySelectorAll('.product-card').forEach(card => {
    const id = card.getAttribute('data-id');
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('add-cart')) {
        window.location.href = `product.html?id=${id}`;
      }
    });
  });

  // Asignar eventos de click a los botones "Agregar al carrito"
  container.querySelectorAll('.add-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(button.getAttribute('data-id'));
      const prod = mostSoldProducts.find(p => p.product_id === id);
      if (prod) {
        showProductPreview(prod);
      }
    });
  });
}

function renderMostSoldProducts(products) {
  mostSoldProducts = products;
  mostSoldPage = 0;
  renderMostSoldProductsPage();
  updateArrowState();
}

function updateArrowState() {
  // Puedes usar esto para actualizar flechas de paginación si lo necesitas
}

// Solo una flecha "Next" que avanza o reinicia
document.getElementById('mostSoldNext')?.addEventListener('click', () => {
  const totalPages = Math.ceil(mostSoldProducts.length / productsPerPage);
  if (mostSoldPage < totalPages - 1) {
    mostSoldPage++;
  } else {
    mostSoldPage = 0;
  }
  renderMostSoldProductsPage();
});

// Función para mostrar modal con vista previa y selección de talla (igual que en paste.txt)
function showProductPreview(producto) {
  modal.innerHTML = '';
  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');
  modalContent.innerHTML = `
    <h2>${producto.name}</h2>
    <img src="/uploads/${producto.image}" alt="${producto.name}">
    <div class="precio">
      ${producto.discount && producto.discount > 0
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
  if (Array.isArray(producto.sizes) && producto.sizes.length > 0) {
    producto.sizes.forEach(sizeObj => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${sizeObj.name} (${sizeObj.stock} disponibles)`;
      btn.dataset.sizeId = typeof sizeObj.id !== 'undefined' && sizeObj.id !== null ? sizeObj.id : '';
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
    const tieneDescuento = producto.discount && producto.discount > 0;
    const precioFinal = tieneDescuento 
      ? (producto.price * (1 - producto.discount / 100)).toFixed(2)
      : producto.price.toFixed(2);
    const productToAdd = {
      id: producto.product_id,
      img: `/uploads/${producto.image}`,
      title: producto.name,
      price: parseFloat(precioFinal),
      originalPrice: producto.price,
      discount: producto.discount || 0,
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

function renderDiscountedProducts(products) {
  const container = document.getElementById('discounted-products');
  container.innerHTML = '';
  products.forEach(prod => {
    const discountedPrice = (prod.price * (1 - prod.discount / 100)).toFixed(2);
    container.innerHTML += `
      <div class="product-card">
        <img src="/uploads/${prod.image}" alt="${prod.name}" />
        <h3>${prod.name}</h3>
        <p>Precio original: <span style="text-decoration: line-through;">$${prod.price}</span></p>
        <p>Precio con descuento: $${discountedPrice}</p>
        <p>Descuento: ${prod.discount}%</p>
      </div>
    `;
  });
}

function initDiscount() {
  fetch('/api/discounts/most-sold')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => renderMostSoldProducts(data))
    .catch(err => {
      console.error(err);
      document.getElementById('most-sold').innerHTML = '<p>No se pudieron cargar los productos más vendidos.</p>';
    });

  fetch('/api/discounts/discounted-products')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => renderDiscountedProducts(data))
    .catch(err => {
      console.error(err);
      document.getElementById('discounted-products').innerHTML = '<p>No se pudieron cargar los productos en descuento.</p>';
    });
}

document.addEventListener('DOMContentLoaded', initDiscount);

document.getElementById('groupDiscountForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const categoryId = document.getElementById('groupCategory').value;
  const subcategoryId = document.getElementById('groupSubcategory').value;
  const discount = document.getElementById('groupDiscount').value;

  const payload = {
    discount: parseInt(discount, 10)
  };
  if (categoryId) payload.category_id = categoryId;
  if (subcategoryId) payload.subcategory_id = subcategoryId;

  try {
    const res = await fetch('/api/products/discount-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const resultDiv = document.getElementById('groupDiscountResult');
    resultDiv.style.display = 'block';
    resultDiv.textContent = res.ok
      ? 'Descuento aplicado correctamente'
      : 'Error: ' + (data.error || 'Error desconocido');
    if (res.ok) {
      fetchProductos(); // Recarga la tabla de productos (asegúrate de tener esta función)
    }
  } catch (err) {
    const resultDiv = document.getElementById('groupDiscountResult');
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Error de conexión';
  }
});
