const productosContainer = document.querySelector("#productos");
const carritoContainer = document.getElementById('carrito');
const totalContainer = document.getElementById('total');
let carrito = [];

document.addEventListener("DOMContentLoaded", () => {
  if (productosContainer) {
    productosContainer.addEventListener("click", getDataElement);
  }
  mostrarCarrito();
});

function getDataElement(e) {
  if (e.target.classList.contains("add-cart")) {
    const productCard = e.target.closest('.producto');
    const productId = e.target.getAttribute('data-id');
    const productName = productCard.querySelector('h2').textContent;
    const productPrice = productCard.querySelector('.precio').textContent.replace('$', '');
    const productImage = productCard.querySelector('img').src;

    const producto = {
      id: productId,
      name: productName,
      price: parseFloat(productPrice),
      image: productImage,
      cantidad: 1
    };

    addToCart(producto);
  }
}

function addToCart(producto) {
  const existe = carrito.find(item => item.id === producto.id);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push(producto);
  }

  mostrarCarrito();
}

function mostrarCarrito() {
  carritoContainer.innerHTML = ''; // Limpiar contenido previo

  carrito.forEach(producto => {
    const div = document.createElement('div');
    div.classList.add('producto-carrito');
    div.innerHTML = `
      <img src="${producto.image}" alt="${producto.name}" style="width:40px;height:40px;object-fit:contain;margin-right:8px;">
      <span>${producto.name} (x${producto.cantidad})</span>
      <span style="margin-left:auto;">$${(producto.price * producto.cantidad).toFixed(2)}</span>
    `;
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";
    carritoContainer.appendChild(div);
  });

  // Calcular total
  const total = carrito.reduce((acc, producto) => acc + producto.price * producto.cantidad, 0);
  totalContainer.textContent = `Total: $${total.toFixed(2)}`;
}