const productsModule = (() => {
  let products = [];

  // Contenedor donde se mostrarán los productos
  const contenedor = document.getElementById('productos');

  function init() {
    fetchProducts();
  }

  // Función para obtener productos desde la API
  function fetchProducts() {
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => {
        products = data;
        renderProducts();
        attachAddCartListeners();
      })
      .catch(error => console.error('Error al obtener los productos:', error));
  }

  // Renderiza los productos en el contenedor
  function renderProducts() {
    if (!contenedor) return;
    contenedor.innerHTML = ''; // Limpia antes de renderizar

    products.forEach(producto => {
      const card = document.createElement('div');
      card.className = 'producto';
      card.innerHTML = `
        <img src="/uploads/${producto.image}" alt="${producto.name}">
        <h2>${producto.name}</h2>
        <p>${producto.category_name}</p>
        <div class="precio">$${producto.price}</div>
        <button class="add-cart" data-id="${producto.product_id}">Agregar al carrito</button>
      `;

      // Redirigir al hacer click en cualquier parte del card excepto el botón "Agregar al carrito"
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-cart')) {
          window.location.href = `product.html?id=${producto.product_id}`;
        }
      });

      contenedor.appendChild(card);
    });
  }

  // Agrega listeners a los botones "Agregar al carrito"
  function attachAddCartListeners() {
    const buttons = contenedor.querySelectorAll('.add-cart');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.getAttribute('data-id'));
        const producto = products.find(p => p.product_id === id);
        if (producto) {
          // Llama al módulo carrito para agregar el producto
          if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
            // Prepara el objeto con las propiedades que usa el carrito
            const productToAdd = {
              id: producto.product_id,
              img: `/uploads/${producto.image}`,
              title: producto.name,
              price: producto.price
            };
            window.cartModule.addToCart(productToAdd);
          } else {
            console.warn('cartModule no está definido o no tiene addToCart');
          }
        }
      });
    });
  }

  return {
    init
  };
})();

// Inicializa el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  productsModule.init();
});
