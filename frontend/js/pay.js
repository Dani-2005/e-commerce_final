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
  let totalSinDescuento = 0;
  let totalConDescuento = 0;
  items.forEach(item => {
    const discount = item.discount || 0;
    totalSinDescuento += item.price * item.quantity;
    if (discount > 0) {
      const priceWithDiscount = item.price * (1 - discount / 100);
      totalConDescuento += priceWithDiscount * item.quantity;
    } else {
      totalConDescuento += item.price * item.quantity;
    }
  });
  const ahorrado = totalSinDescuento - totalConDescuento;
  container.innerHTML = `
    <div>Total sin descuento: <span style="text-decoration:line-through;color:#888;">$${totalSinDescuento.toFixed(2)}</span></div>
    <div>Total a pagar: <strong style="color:red;">$${totalConDescuento.toFixed(2)}</strong></div>
    <div style="color:green;">Ahorrado: $${ahorrado.toFixed(2)}</div>
  `;
}

function configurarMetodosPago() {
  const divPay = document.querySelector('.form-pay');
  if (!divPay) {
    console.error("No se encontró el contenedor .form-pay");
    return;
  }
  divPay.innerHTML = `
    <h3>Métodos de Pago</h3>
    <button data-metodo="pago_movil">Pago Móvil</button>
    <button data-metodo="efectivo">Efectivo</button>
    <button data-metodo="efectivo_pago_movil">Efectivo y Pago Móvil</button>
  `;

  let metodoSeleccionado = null;
  divPay.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      metodoSeleccionado = btn.getAttribute('data-metodo');
      divPay.querySelectorAll('button').forEach(b => b.style.backgroundColor = '');
      btn.style.backgroundColor = '#1976d2';

      // Mostrar formulario si corresponde
      mostrarFormularioPago(metodoSeleccionado);
    });
  });

  window.metodoSeleccionado = () => metodoSeleccionado;
}

function mostrarFormularioPago(metodo) {
  let formContainer = document.getElementById('formulario-pago-movil');
  if (!formContainer) {
    formContainer = document.createElement('div');
    formContainer.id = 'formulario-pago-movil';
    document.querySelector('.form-pay').appendChild(formContainer);
  }
  if (metodo === 'pago_movil' || metodo === 'efectivo_pago_movil') {
    formContainer.innerHTML = `
      <h4>Detalles de Pago Móvil</h4>
      <label>Número de Teléfono:</label><br>
      <input type="text" id="telefono-pago-movil" placeholder="Ej: 04141234567"><br>
      <label>Número de Referencia:</label><br>
      <input type="text" id="referencia-pago-movil" placeholder="Referencia bancaria"><br>
      <label>Imagen del Capture:</label><br>
      <input type="file" id="capture-pago-movil" name="captura_pago_movil" accept="image/*"><br>
    `;
  } else {
    formContainer.innerHTML = '';
  }
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

  let datosPagoMovil = {};
  if (metodo === 'pago_movil' || metodo === 'efectivo_pago_movil') {
    datosPagoMovil.telefono = document.getElementById('telefono-pago-movil').value;
    datosPagoMovil.referencia = document.getElementById('referencia-pago-movil').value;
    datosPagoMovil.capture = document.getElementById('capture-pago-movil').files[0];
    if (!datosPagoMovil.telefono || !datosPagoMovil.referencia || !datosPagoMovil.capture) {
      alert('Por favor completa todos los campos de Pago Móvil.');
      return;
    }
  }

  try {
    // Obtener datos de la orden y dirección
    const orderRes = await fetch(`/api/orders/${orderId}`, { credentials: 'include' });
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

    // Crear FormData
    const formData = new FormData();
    formData.append('metodo_pago', metodo);
    formData.append('direccion', JSON.stringify({
      nombre: direccion.first_name + ' ' + direccion.last_name,
      telefono: direccion.phone,
      calle: direccion.address + (direccion.department ? ' ' + direccion.department : ''),
      ciudad_estado_cp: `${direccion.city} ${direccion.state} ${direccion.postal_code}`
    }));
    formData.append('total', total);

    // Si es pago móvil, agrega los campos extra
    if (metodo === 'pago_movil' || metodo === 'efectivo_pago_movil') {
      formData.append('telefono_pago_movil', datosPagoMovil.telefono);
      formData.append('referencia_pago_movil', datosPagoMovil.referencia);
      formData.append('captura_pago_movil', datosPagoMovil.capture);
    }

    // Enviar al backend
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData // No pongas headers de Content-Type, el navegador lo maneja
    });

    if (!res.ok) throw new Error('Error al actualizar la orden con el pago');

    alert('Pago realizado con éxito. Gracias por tu compra.');
    window.location.href = '/pages/order_history.html';

  } catch (error) {
    alert('Error al procesar el pago: ' + error.message);
  }
});


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
}