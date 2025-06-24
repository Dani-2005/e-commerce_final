function initCart() {
  cartModule.init();
}

const cartModule = (() => {
  let openCartBtn, closeCartBtn, cartFloat, cartContainer, cartTotal;

  function init() {
    // Obtener referencias del DOM después de cargar los includes
    openCartBtn = document.getElementById("open-cart");
    closeCartBtn = document.getElementById("close-cart");
    cartFloat = document.getElementById("cart-float");
    cartContainer = document.getElementById("cart-container");
    cartTotal = document.getElementById("cart-total");

    // Cargar carrito desde backend
    fetchCartFromDb();

    // Eventos para abrir/cerrar carrito
    if (openCartBtn) {
      openCartBtn.addEventListener("click", () => {
        cartFloat.classList.add("active");
      });
    }
    if (closeCartBtn) {
      closeCartBtn.addEventListener("click", () => {
        cartFloat.classList.remove("active");
      });
    }

    // Asignar evento al botón de finalizar compra
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.onclick = async () => {
        if (!window.productsArray || window.productsArray.length === 0) {
          alert("El carrito está vacío.");
          return;
        }
        try {
          const productsMapped = window.productsArray.map(product => ({
            product_id: product.id,
            quantity: product.quantity,
            price: product.price,
            name: product.title,
            image: product.img,
            size_id: product.size_id 

          }));

          const res = await fetch("http://localhost:3000/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ products: productsMapped })
          });

          const data = await res.json();

          if (res.ok) {
            alert("¡Orden creada con éxito!");
            window.productsArray = [];
            renderCart();

            // NUEVO: Limpiar carrito en backend
            await fetch("http://localhost:3000/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify([])
            });

            if (data.orderId) {
              window.location.href = `order.html?orderId=${data.orderId}`;
            }
          } else {
            alert("Error al crear la orden: " + (data.error || "Intenta de nuevo"));
          }
        } catch (err) {
          alert("Error de conexión al crear la orden.");
          console.error(err);
        }
      };
    }
  }

  // Agrega un producto al carrito o aumenta cantidad si ya existe
function addToCart(product) {
  const exists = window.productsArray.some(p => p.id === product.id && p.size_id === product.size_id);

  // Calcula el precio original usando el descuento recibido
  const discount = product.discount || 0;
  let price_original = product.price;
  if (discount > 0) {
    price_original = parseFloat((product.price / (1 - discount / 100)).toFixed(2));
  }

  if (exists) {
    window.productsArray = window.productsArray.map(p => {
      if (p.id === product.id && p.size_id === product.size_id) {
        p.quantity++;
      }
      return p;
    });
  } else {
    window.productsArray = [
      ...window.productsArray,
      { ...product, price_original }
    ];
  }

  renderCart();
  saveDb();

  if (cartFloat) {
    cartFloat.classList.add("active");
  }
}


  // Renderiza los productos en el carrito
  const sizeNames = {
  1: "S",
  2: "M",
  3: "L",
  4: "XL",
  5: "28",
  6: "30",
  7: "32",
  8: "34",
  9: "39",
  10: "40",
  11: "41",
  12: "42",
  13: "ÚNICO"
};

function renderCart() {
  if (!cartContainer || !cartTotal) return;

  cartContainer.innerHTML = "";
  let total = 0;

  window.productsArray.forEach(product => {
    const sizeName = sizeNames[product.size_id] || 'N/A';
    const tieneDescuento = product.discount && product.discount > 0;
    const precioOriginal = product.price_original ? product.price_original : product.price;
    const precioFinal = product.price;

    const priceHtml = tieneDescuento
      ? `<span class="precio-original" style="text-decoration:line-through;color:#888;">$${(precioOriginal * product.quantity).toFixed(2)}</span>
         <span class="precio-descuento" style="color:red;font-weight:bold;margin-left:8px;">$${(precioFinal * product.quantity).toFixed(2)}</span>
         <span class="porcentaje-descuento" style="color:red;margin-left:8px;">(-${product.discount}%)</span>`
      : `<span>$${(precioFinal * product.quantity).toFixed(2)}</span>`;

    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${product.img}" width="50" />
      <span>${product.title}</span>
      <button class="decrease" data-id="${product.id}">-</button>
      <span class="quantity">${product.quantity}</span>
      <span>Talla: ${sizeName}</span>
      <button class="increase" data-id="${product.id}">+</button>
      ${priceHtml}
    `;
    cartContainer.appendChild(div);
    total += precioFinal * product.quantity;
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;

  // Añadir eventos para botones + y -
  cartContainer.querySelectorAll(".increase").forEach(btn => {
    btn.addEventListener("click", increaseItem);
  });
  cartContainer.querySelectorAll(".decrease").forEach(btn => {
    btn.addEventListener("click", decreaseItem);
  });
}




  // Aumenta la cantidad de un producto
  function increaseItem(e) {
    const id = parseInt(e.target.getAttribute("data-id"));
    window.productsArray = window.productsArray.map(p => {
      if (p.id === id) {
        p.quantity++;
      }
      return p;
    });
    renderCart();
    saveDb();
  }

  // Disminuye la cantidad o elimina el producto si llega a 0
  function decreaseItem(e) {
    const id = parseInt(e.target.getAttribute("data-id"));
    window.productsArray = window.productsArray.reduce((acc, p) => {
      if (p.id === id) {
        if (p.quantity > 1) {
          p.quantity--;
          acc.push(p);
        }
        // Si quantity es 1, no lo agregamos (lo eliminamos)
      } else {
        acc.push(p);
      }
      return acc;
    }, []);
    renderCart();
    saveDb();
  }

  // Guarda el carrito en el backend
  function saveDb() {
  const productsMapped = window.productsArray.map(product => ({
    product_id: product.id,
    quantity: product.quantity,
    price: product.price,
    name: product.title,
    image: product.img,
    size_id: product.size_id,
    discount: product.discount || 0
     // Asegúrate de que esto exista
  }));

  // Parchar: mostrar qué se va a guardar
  console.log("Enviando al backend2:", productsMapped);

  fetch("http://localhost:3000/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productsMapped),
  })
    .then(res => res.json())
    .then(data => {
      console.log("Carrito guardado:", data);
    })
    .catch(err => {
      console.error("Error al guardar el carrito:", err);
    });
}


  // Carga el carrito desde el backend
  function fetchCartFromDb() {
    fetch("http://localhost:3000/api/cart", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const cartId = data[data.length - 1].id;
          fetch(`http://localhost:3000/api/cart/${cartId}/items`, {
            method: "GET",
            credentials: "include",
          })
            .then(res => res.json())
            .then(items => {
              window.productsArray = items.map(item => {
                const discount = item.discount || 0;
                let price_original = item.price;
                if (discount > 0) {
                  price_original = parseFloat((item.price / (1 - discount / 100)).toFixed(2));
                }
                return {
                  id: item.product_id,
                  quantity: item.quantity,
                  price: item.price,
                  price_original: price_original,
                  title: item.name,
                  img: item.image,
                  size_id: item.size_id,
                  discount: discount
                };
              });
              renderCart();
            });
        }
      })
      .catch(err => {
        console.error("Error al obtener el carrito:", err);
      });
  }

  return {
    init,
    addToCart,
    renderCart,
  };

})();

document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", async () => {
    if (!window.productsArray || window.productsArray.length === 0) {
      alert("El carrito está vacío.");
      return;
    }

    try {
      const productsMapped = window.productsArray.map(product => ({
        product_id: product.id,
        quantity: product.quantity,
        price: product.price,
        name: product.title,
        image: product.img,
        size_id: item.size_id

      }));

      const res = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ products: productsMapped }) // <-- Aquí va el body
      });

      const data = await res.json();

      if (res.ok) {
        alert("¡Orden creada con éxito!");
        window.productsArray = [];
        renderCart(); // Asegúrate que esta función esté accesible
        if (data.orderId) {
          window.location.href = `order.html?orderId=${data.orderId}`;
        }
      } else {
        alert("Error al crear la orden: " + (data.error || "Intenta de nuevo"));
      }
    } catch (err) {
      alert("Error de conexión al crear la orden.");
      console.error(err);
    }
  });
});

if (!window.productsArray) window.productsArray = [];

window.cartModule = cartModule;



