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

function updateArrowState() {
  // Deshabilita flechas si no hay más páginas
  document.getElementById('mostSoldPrev').disabled = mostSoldPage === 0;
  document.getElementById('mostSoldNext').disabled = (mostSoldPage + 1) * productsPerPage >= mostSoldProducts.length;
}

document.getElementById('mostSoldPrev').addEventListener('click', () => {
  if (mostSoldPage > 0) {
    mostSoldPage--;
    renderMostSoldProductsPage();
    updateArrowState();
  }
});

document.getElementById('mostSoldNext').addEventListener('click', () => {
  if ((mostSoldPage + 1) * productsPerPage < mostSoldProducts.length) {
    mostSoldPage++;
    renderMostSoldProductsPage();
    updateArrowState();
  }
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
