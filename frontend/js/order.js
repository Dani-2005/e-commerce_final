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
        // Obtener user_id desde sessionStorage
        const user_id = sessionStorage.getItem('user_id');
        if (!user_id) {
          alert('No se encontró el usuario. Por favor, inicia sesión.');
          return;
        }

        // Verificar si el usuario tiene perfil completo
        const perfilRes = await fetch(`http://localhost:3000/api/users/profiles/${user_id}`, {
          credentials: 'include'
        });

        if (!perfilRes.ok) {
          throw new Error('Error al verificar perfil');
        }

        const perfiles = await perfilRes.json();

        if (!perfiles || perfiles.length === 0) {
          alert('Debes completar tu perfil antes de realizar el pago.');
          window.location.href = '/pages/addprofile.html';
          return;
        }

        // Proceder con el pago
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
