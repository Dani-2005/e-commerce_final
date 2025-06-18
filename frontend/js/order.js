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

    // Mapeo de size_id a nombre de talla (ajusta según tus tallas reales)
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

    let order;
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("No se pudo obtener la orden");
      }
      order = await res.json();

      let total = 0;
      const tbody = document.querySelector("#orderTable tbody");
      tbody.innerHTML = "";

      order.items.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        // Obtener el nombre de la talla a partir de size_id
        const talla = item.size_id ? (sizeNames[item.size_id] || 'N/A') : 'N/A';

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.name}</td>
          <td><img src="${item.image}" width="50" alt="Imagen de ${item.name}"></td>
          <td>${item.quantity}</td>
          <td>${talla}</td>
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

    const payBtn = document.getElementById("pagar-btn");
    if (!payBtn) return;

    if (order.status === "pendiente") {
      payBtn.textContent = "Pagar";
      payBtn.onclick = async () => {
        try {
          // Obtener user_id desde sessionStorage
          const user_id = sessionStorage.getItem('user_id');
          if (!user_id) {
            alert('Debes iniciar sesión para continuar.');
            window.location.href = '/pages/profile.html'; // Ajusta la ruta a perfil o login
            return;
          }

          // Consultar direcciones del usuario
          const res = await fetch(`/api/users/profiles/${user_id}`, { credentials: 'include' });
          if (!res.ok) throw new Error('No se pudo verificar la dirección.');

          const direcciones = await res.json();

          if (!direcciones || direcciones.length === 0) {
            alert('No tienes ninguna dirección registrada. Por favor, completa tu dirección en el perfil.');
            window.location.href = '/pages/profile.html'; // Ajusta la ruta a perfil para llenar dirección
            return;
          }

          // Si tiene dirección, ir a pagar
          window.location.href = `/pages/pay.html?orderId=${orderId}`;

        } catch (error) {
          alert('Error al verificar dirección: ' + error.message);
        }
      };
    } else {
      payBtn.textContent = "Mostrar factura";
      payBtn.onclick = () => {
        mostrarFactura(orderId);
      };
    }
  });
};


// Función para mostrar la factura
async function mostrarFactura(orderId) {
  try {
    const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, { credentials: "include" });
    if (!res.ok) throw new Error('No se pudo obtener la factura');
    const data = await res.json();

    const facturaDiv = document.getElementById('contenidoFactura');
    const factura = data;

    let direccionObj = {};
    if (factura.direccion) {
      try {
        direccionObj = JSON.parse(factura.direccion);
      } catch {
        direccionObj = { info: factura.direccion };
      }
    }

    facturaDiv.innerHTML = `
      <p><strong>ID Orden:</strong> ${factura.id}</p>
      <p><strong>Usuario:</strong> ${factura.user?.username || 'N/A'} (${factura.user?.email || 'N/A'})</p>
      <p><strong>Fecha:</strong> ${new Date(factura.created_at).toLocaleString()}</p>
      <p><strong>Estado:</strong> ${factura.status}</p>
      <p><strong>Método de Pago:</strong> ${factura.metodo_pago}</p>
      <h3>Dirección</h3>
      <p>Nombre: ${direccionObj.nombre || ''}</p>
      <p>Teléfono: ${direccionObj.telefono || ''}</p>
      <p>Calle: ${direccionObj.calle || ''}</p>
      <p>Ciudad/Estado/CP: ${direccionObj.ciudad_estado_cp || ''}</p>
      <h3>Items</h3>
      <ul>
        ${factura.items.map(item => `<li>${item.name} - Cantidad: ${item.quantity} - Precio: $${item.price.toFixed(2)}</li>`).join('')}
      </ul>
      <p><strong>Total:</strong> $${factura.total.toFixed(2)}</p>
    `;

    document.getElementById('facturaPreview').style.display = 'block';
  } catch (error) {
    alert('Error al cargar la factura: ' + error.message);
  }
}

document.getElementById('cerrarFactura').addEventListener('click', () => {
  document.getElementById('facturaPreview').style.display = 'none';
});
