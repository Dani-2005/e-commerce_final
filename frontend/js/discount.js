let mostSoldProducts = [];
let mostSoldPage = 0;
const productsPerPage = 5;

function renderMostSoldProductsPage() {
  const container = document.getElementById('most-sold');
  container.innerHTML = '';
  const start = mostSoldPage * productsPerPage;
  const end = start + productsPerPage;
  const pageProducts = mostSoldProducts.slice(start, end);

  pageProducts.forEach(prod => {
    container.innerHTML += `
      <div class="product-card">
        <img src="/uploads/${prod.image}" alt="${prod.name}" />
        <h3>${prod.name}</h3>
        <p>Precio: $${prod.price}</p>
        <p>Vendidos esta semana: ${prod.total_vendidos}</p>
      </div>
    `;
  });
}

function renderMostSoldProducts(products) {
  mostSoldProducts = products;
  mostSoldPage = 0;
  renderMostSoldProductsPage();
  updateArrowState();
}

function updateArrowState() {}

// Solo una flecha "Next" que avanza o reinicia
document.getElementById('mostSoldNext').addEventListener('click', () => {
  const totalPages = Math.ceil(mostSoldProducts.length / productsPerPage);
  if (mostSoldPage < totalPages - 1) {
    mostSoldPage++;
  } else {
    mostSoldPage = 0; // Vuelve al inicio si está en la última página
  }
  renderMostSoldProductsPage();
  updateArrowState();
});


// Tu función de productos en descuento sigue igual
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

document.getElementById('groupDiscountForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const categoryId = document.getElementById('groupCategory').value;
  const subcategoryId = document.getElementById('groupSubcategory').value;
  const discount = document.getElementById('groupDiscount').value;

  // Construye el payload
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
      fetchProductos(); // Recarga la tabla de productos
    }
  } catch (err) {
    const resultDiv = document.getElementById('groupDiscountResult');
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Error de conexión';
  }
});
