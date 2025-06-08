window.initPay = function() {
  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (!orderId) {
      alert("No se encontró el ID de la orden.");
      return;
    }

    try {
      // Obtener user_id (de sessionStorage o backend)
      let user_id = sessionStorage.getItem('user_id');
      if (!user_id) {
        const userRes = await fetch('/api/users/me', { credentials: 'include' });
        if (!userRes.ok) throw new Error('No autenticado');
        const userData = await userRes.json();
        user_id = userData.id;
        sessionStorage.setItem('user_id', user_id);
      }

      // Cargar direcciones
      const perfRes = await fetch(`/api/users/profiles/${user_id}`, { credentials: 'include' });
      if (!perfRes.ok) throw new Error('Error al obtener direcciones');
      const direcciones = await perfRes.json();

      mostrarDireccionPrincipal(direcciones);

      // Cargar orden
      const orderRes = await fetch(`http://localhost:3000/api/orders/${orderId}`, { credentials: 'include' });
      if (!orderRes.ok) throw new Error('Error al obtener la orden');
      const order = await orderRes.json();

      mostrarProductos(order.items);
      mostrarTotal(order.items);

      configurarMetodosPago();
      configurarBotonPagar(orderId);

    } catch (error) {
      console.error(error);
      alert("Error al cargar la información de pago.");
    }
  });
};

function mostrarDireccionPrincipal(direcciones) {
  const container = document.getElementById('direccion-principal');
  container.innerHTML = '';
  if (!direcciones || direcciones.length === 0) {
    container.innerHTML = '<p>No tienes direcciones guardadas.</p>';
    return;
  }
  const principal = direcciones[0];
  container.innerHTML = `
    <h3>Dirección Principal</h3>
    <div class="direccion-card">
      <div class="direccion-info">
        <strong>${principal.first_name} ${principal.last_name}</strong><br>
        ${principal.address} ${principal.department ? principal.department : ''}<br>
        ${principal.city} ${principal.state} ${principal.postal_code}<br>
        <span class="telefono">${principal.phone || ''}</span>
      </div>
    </div>
    <button id="cambiar-direccion">Cambiar</button>
    <hr>
  `;
}

function mostrarProductos(items) {
  const container = document.querySelector('.productos-list');
  if (!container) {
    console.error("No se encontró el contenedor .productos-list");
    return;
  }
  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'producto';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div>${item.quantity}</div>
    `;
    container.appendChild(div);
  });
}

function mostrarTotal(items) {
  const container = document.querySelector('.detalle-total');
  if (!container) {
    console.error("No se encontró el contenedor .detalle-total");
    return;
  }
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });
  container.textContent = `Total a pagar: $${total.toFixed(2)}`;
}

function configurarMetodosPago() {
  const divPay = document.querySelector('.form-pay');
  if (!divPay) {
    console.error("No se encontró el contenedor .form-pay");
    return;
  }
  divPay.innerHTML = `
    <h3>Métodos de Pago</h3>
    <button data-metodo="paypal">PayPal</button>
    <button data-metodo="zinli">Zinli</button>
    <button data-metodo="tarjeta">Tarjeta de Crédito</button>
    <button data-metodo="gpa">GPA</button>
  `;

  let metodoSeleccionado = null;
  divPay.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      metodoSeleccionado = btn.getAttribute('data-metodo');
      divPay.querySelectorAll('button').forEach(b => b.style.backgroundColor = '');
      btn.style.backgroundColor = '#1976d2';
    });
  });

  window.metodoSeleccionado = () => metodoSeleccionado;
}

function configurarBotonPagar(orderId) {
  const divPagar = document.querySelector('.div-pagar');
  if (!divPagar) {
    console.error("No se encontró el contenedor .div-pagar");
    return;
  }
  divPagar.innerHTML = `<button id="finalizar-pago">Finalizar Compra</button>`;

  document.getElementById('finalizar-pago').addEventListener('click', async () => {
    const metodo = window.metodoSeleccionado ? window.metodoSeleccionado() : null;
    if (!metodo) {
      alert('Por favor selecciona un método de pago.');
      return;
    }

    try {
      // Obtener datos de la orden y dirección
      const orderRes = await fetch(`http://localhost:3000/api/orders/${orderId}`, { credentials: 'include' });
      if (!orderRes.ok) throw new Error('Error al obtener la orden');
      const order = await orderRes.json();

      let user_id = sessionStorage.getItem('user_id');
      const perfRes = await fetch(`/api/users/profiles/${user_id}`, { credentials: 'include' });
      if (!perfRes.ok) throw new Error('Error al obtener direcciones');
      const direcciones = await perfRes.json();
      const direccion = direcciones[0];

      // Calcular total
      let total = 0;
      order.items.forEach(item => {
        total += item.price * item.quantity;
      });

      // Crear objeto factura
      const factura = {
        direccion: direccion,
        metodo_pago: metodo,
        productos: order.items,
        total: total
      };

    // Enviar datos al backend para actualizar la orden y guardar método de pago y dirección
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        metodo_pago: metodo,
        direccion: {
            nombre: direccion.first_name + ' ' + direccion.last_name,
            telefono: direccion.phone,
            calle: direccion.address + (direccion.department ? ' ' + direccion.department : ''),
            ciudad_estado_cp: `${direccion.city} ${direccion.state} ${direccion.postal_code}`
        }
        })
      });

      if (!res.ok) throw new Error('Error al actualizar la orden con el pago');

      alert('Pago realizado con éxito. Gracias por tu compra.');
      window.location.href = '/pages/order_history.html';

    } catch (error) {
      alert('Error al procesar el pago: ' + error.message);
    }
  });
}

// Modal para mostrar la factura
function mostrarFactura(factura) {
  // Crear HTML de la factura
  let productosHtml = factura.productos.map(p =>
    `<li>${p.name} x${p.quantity} - $${(p.price * p.quantity).toFixed(2)}</li>`
  ).join('');
  let html = `
    <div id="modal-factura" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:#fff;padding:2em;border-radius:8px;max-width:400px;">
        <h2>Factura</h2>
        <strong>Dirección:</strong><br>
        ${factura.direccion.first_name} ${factura.direccion.last_name}<br>
        ${factura.direccion.address} ${factura.direccion.department || ''}<br>
        ${factura.direccion.city} ${factura.direccion.state} ${factura.direccion.postal_code}<br>
        <hr>
        <strong>Método de pago:</strong> ${factura.metodo_pago}<br>
        <hr>
        <strong>Productos:</strong>
        <ul>${productosHtml}</ul>
        <hr>
        <strong>Total:</strong> $${factura.total.toFixed(2)}
        <br><br>
        <button id="cerrar-factura">Cerrar</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('cerrar-factura').onclick = function() {
    document.getElementById('modal-factura').remove();
    // Aquí puedes continuar con el pago si lo deseas
  };
}
