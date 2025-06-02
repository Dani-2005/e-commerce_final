// recommendedModule: muestra productos recomendados (hasta 12) por categoría o subcategoría
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
    container.innerHTML = recommended.map(product => `
      <div class="recommended-product" data-id="${product.product_id}" style="cursor:pointer;">
        <img src="/uploads/${product.image}" alt="${product.name}">
        <h4>${product.name}</h4>
        <div class="precio">$${product.price}</div>
        <button class="add-cart-recommended" data-id="${product.product_id}">Agregar al carrito</button>
      </div>
    `).join("");

    // Evento para agregar al carrito
    container.querySelectorAll('.add-cart-recommended').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el click en el botón dispare el evento del card
        const id = parseInt(button.getAttribute('data-id'));
        const product = recommended.find(p => p.product_id === id);
        if (window.cartModule && typeof window.cartModule.addToCart === 'function' && product) {
          const productToAdd = {
            id: product.product_id,
            img: `/uploads/${product.image}`,
            title: product.name,
            price: product.price
          };
          window.cartModule.addToCart(productToAdd);
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

        // Aquí inicializamos las recomendaciones con la categoría y subcategoría del producto
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

    if (imgDiv && textDiv) {
      imgDiv.innerHTML = `<img src="/uploads/${product.image}" alt="${product.name}">`;

      textDiv.innerHTML = `
        <h2>${product.name}</h2>
        <p>${product.category_name}</p>
        <div class="precio">$${product.price}</div>
        <button class="add-cart" data-id="${product.product_id}">Agregar al carrito</button>
      `;
    }
  }

  function attachAddCartListener() {
    const button = contenedor.querySelector('.add-cart');
    if (button) {
      button.addEventListener('click', () => {
        if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
          const productToAdd = {
            id: product.product_id,
            img: `/uploads/${product.image}`,
            title: product.name,
            price: product.price
          };
          window.cartModule.addToCart(productToAdd);
        } else {
          console.warn('cartModule no está definido o no tiene addToCart');
        }
      });
    }
  }

  return { init };
})();

// Inicializa todo al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  productModule.init();
});
