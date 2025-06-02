// Obtiene el parámetro id de la URL
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderProduct(producto) {
  const contenedor = document.getElementById('producto-detalle');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="producto-detalle-card">
      <img src="/uploads/${producto.image}" alt="${producto.name}">
      <h1>${producto.name}</h1>
      <p>Categoría: ${producto.category_name}</p>
      <div class="precio">$${producto.price}</div>
      <p>${producto.description || ''}</p>
      <button id="add-cart">Agregar al carrito</button>
    </div>
  `;
  document.getElementById('add-cart').addEventListener('click', () => {
    if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
      const productToAdd = {
        id: producto.product_id,
        img: `/uploads/${producto.image}`,
        title: producto.name,
        price: producto.price
      };
      window.cartModule.addToCart(productToAdd);
    }
  });
}

function fetchProduct(id) {
  fetch(`http://localhost:3000/api/products/${id}`)
    .then(res => res.json())
    .then(producto => renderProduct(producto))
    .catch(err => {
      document.getElementById('producto-detalle').innerHTML = 'Producto no encontrado';
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getProductIdFromUrl();
  if (id) {
    fetchProduct(id);
  } else {
    document.getElementById('producto-detalle').innerHTML = 'ID de producto no especificado';
  }
});
