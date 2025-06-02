// orders.js

const ordersModule = (() => {

  // Inicializa el evento del botón "Finalizar compra"
  function init() {
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", createOrder);
    }
  }

  // Función async para crear la orden
  async function createOrder() {
    if (!window.productsArray || window.productsArray.length === 0) {
      alert("El carrito está vacío. Agrega productos antes de realizar un pedido.");
      return;
    }

    try {
      const orderData = {
        products: window.productsArray
      };

      const res = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("¡Orden creada con éxito!");
        window.productsArray = [];
        if (window.cartModule && typeof window.cartModule.renderCart === "function") {
          window.cartModule.renderCart();
        }
        if (data.orderId) {
          window.location.href = `order.html?orderId=${data.orderId}`;
        }
      } else {
        alert("Error al crear la orden: " + (data.error || "Intenta de nuevo"));
      }
    } catch (error) {
      console.error("Error al crear la orden:", error);
      alert("Error de conexión al crear la orden.");
    }
  }

  return {
    init,
    createOrder,
  };

})();

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  ordersModule.init();
});


// Función para inicializar la página de detalle de orden y pago
window.initOrderPage = function() {
  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");

    if (!orderId) {
      document.getElementById("mensaje").textContent = "No se encontró ninguna orden para mostrar.";
      document.getElementById("orderTable").style.display = "none";
      const payBtn = document.getElementById("pagar-btn");
      if (payBtn) payBtn.style.display = "none";
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("No se pudo obtener la orden");
      }
      const order = await res.json();

      let total = 0;
      const tbody = document.querySelector("#orderTable tbody");
      tbody.innerHTML = "";

      order.items.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.name}</td>
          <td><img src="${item.image}" width="50"></td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>$${subtotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById("totalCell").textContent = `$${total.toFixed(2)}`;

    } catch (error) {
      console.error("Error al cargar la orden:", error);
      document.getElementById("mensaje").textContent = "Error al cargar la orden.";
      document.getElementById("orderTable").style.display = "none";
      const payBtn = document.getElementById("pagar-btn");
      if (payBtn) payBtn.style.display = "none";
      return;
    }

    // Asignar evento al botón pagar
    const payBtn = document.getElementById("pagar-btn");
    if (!payBtn) {
      console.error("No se encontró el botón de pagar");
      return;
    }

    payBtn.onclick = async function() {
      try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
          method: "PUT",
          credentials: "include"
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al procesar el pago");
        }

        localStorage.removeItem('cart');
        if (window.productsArray) window.productsArray = [];

        document.getElementById("mensaje").textContent = "¡Pago realizado con éxito! Gracias por tu compra.";
        this.disabled = true;
        document.getElementById("orderTable").style.display = "none";

        setTimeout(() => {
          window.location.href = "order_history.html";
        }, 1500);

      } catch (error) {
        console.error("Error en el pago:", error);
        alert("Error en el pago: " + error.message);
      }
    };
  });
};
