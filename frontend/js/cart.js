const ListProducts = document.querySelector("#productos");
const cartContainer = document.querySelector(".cart > div"); 
const cartTotal = document.querySelector(".cart-total span"); 

window.productsArray = window.productsArray || [];
var productsArray = window.productsArray;

document.addEventListener("DOMContentLoaded", function () {
  fetchCartFromDb();
  eventListeners();
});

function eventListeners() {
  ListProducts.addEventListener("click", getDataElements);
}

function getDataElements(e) {
  if (e.target.classList.contains("add-cart")) {
    const elementHtml = e.target.parentElement;
    selectData(elementHtml);
  }
}

function selectData(p) {
  const id = parseInt(p.querySelector("button").getAttribute("data-id"));

  const exists = window.productsArray.some(product => product.id === id);

  if (exists) {
    window.productsArray = window.productsArray.map(product => {
      if (product.id === id) {
        product.quantity++;
        return product;
      }
      return product;
    });
  } else {
    // Si no existe, lo agregamos
    const productObj = {
      img: p.querySelector("img").src,
      title: p.querySelector("h2").textContent,
      price: parseFloat(p.querySelector(".precio").textContent.replace("$", "")),
      id: id,
      quantity: 1,
    };
    window.productsArray = [...window.productsArray, productObj];
  }
  renderCart();
  saveDb();
  cartFloat.classList.add("active");
}

function renderCart() {
  // Limpiamos el carrito antes de volver a renderizar
  cartContainer.innerHTML = "";

  let total = 0;

  window.productsArray.forEach(product => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${product.img}" width="50" />
      <span>${product.title}</span>
      <span>${product.quantity} x $${product.price.toFixed(2)}</span>
      <button class="remove-item" data-id="${product.id}">Eliminar</button>
    `;
    cartContainer.appendChild(div);

    total += product.price * product.quantity;
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;

  // Agregamos evento para eliminar productos
  cartContainer.querySelectorAll(".remove-item").forEach(btn => {
    btn.addEventListener("click", removeItem);
  });
}

function removeItem(e) {
  const id = parseInt(e.target.getAttribute("data-id"));
  window.productsArray = window.productsArray.filter(product => product.id !== id);
  renderCart();
  saveDb();
}

const openCartBtn = document.getElementById("open-cart");
const closeCartBtn = document.getElementById("close-cart");
const cartFloat = document.getElementById("cart-float");

// Mostrar carrito al hacer clic en el botón
openCartBtn.addEventListener("click", () => {
  cartFloat.classList.add("active");
});

// Ocultar carrito al hacer clic en el botón de cerrar
closeCartBtn.addEventListener("click", () => {
  cartFloat.classList.remove("active");
});

function saveDb() {
  // Mapea los productos al formato esperado por el backend
  const productsMapped = window.productsArray.map(product => ({
    product_id: product.id,
    quantity: product.quantity,
    price: product.price,
    name: product.title,
    image: product.img
  }));

  fetch("http://localhost:3000/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productsMapped),
  })
  .then(res => res.json())
  .then(data => {
    // Puedes mostrar un mensaje de éxito aquí si quieres
    console.log("Carrito guardado:", data);
  })
  .catch(err => {
    console.error("Error al guardar el carrito:", err);
  });
}

function fetchCartFromDb() {
  fetch("http://localhost:3000/api/cart", {
    method: "GET",
    credentials: "include", // si usas cookies para sesión
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(res => res.json())
    .then(data => {
      // Si tu backend devuelve un array de carritos, toma el último y sus productos
      if (Array.isArray(data) && data.length > 0) {
        // Aquí deberías hacer otro fetch para obtener los productos del carrito
        const cartId = data[data.length - 1].id;
        fetch(`http://localhost:3000/api/cart/${cartId}/items`, {
          method: "GET",
          credentials: "include",
        })
          .then(res => res.json())
          .then(items => {
            window.productsArray = items.map(item => ({
              id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              title: item.name,
              img: item.image,
            }));
            renderCart();
          });
      }
    })
    .catch(err => {
      console.error("Error al obtener el carrito:", err);
    });
}

function addOrder() {
  if (window.productsArray.length === 0) {
    alert("El carrito está vacío. Agrega productos antes de realizar un pedido.");
    return;
  }

  const orderData = {
    products: window.productsArray,
  };

  fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then(res => res.json())
    .then(data => {
      console.log("Pedido realizado:", data);
      // Aquí puedes limpiar el carrito o redirigir al usuario
      window.productsArray = [];
      renderCart();
      alert("Pedido realizado con éxito.");
    })
    .catch(err => {
      console.error("Error al realizar el pedido:", err);
      alert("Hubo un error al realizar el pedido. Inténtalo de nuevo.");
    });
}