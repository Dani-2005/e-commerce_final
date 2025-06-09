document.addEventListener('DOMContentLoaded', async () => {
  try {
    let user_id = sessionStorage.getItem('user_id');
    if (!user_id) {
      const userRes = await fetch('/api/users/me', { credentials: 'include' });
      if (!userRes.ok) throw new Error('No autenticado');
      const userData = await userRes.json();
      user_id = userData.id;
      sessionStorage.setItem('user_id', user_id);
    }

    // Variable global para direcciones
    window.direcciones = [];

    const res = await fetch(`/api/users/profiles/${user_id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Error al obtener direcciones');
    window.direcciones = await res.json();

    mostrarDireccionPrincipal(window.direcciones);

    // Botón cerrar modal
    document.getElementById('cerrar-modal').onclick = () => {
      document.getElementById('modal-direcciones').style.display = 'none';
    };

  } catch (error) {
    console.error('Error al obtener usuario o direcciones:', error);
    document.getElementById('direccion-principal').innerHTML = '<p style="color:red;">Debes iniciar sesión para ver esta información.</p>';
  }
});

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
        <strong>${principal.first_name} ${principal.last_name}</strong>
        <span class="telefono">${principal.phone || ''}</span><br>
        ${principal.address} ${principal.department ? principal.department : ''}<br>
        ${principal.city} ${principal.state} United States ${principal.postal_code}<br>
      </div>
    </div>
    <button id="cambiar-direccion">Cambiar</button>
    <hr>
  `;

  document.getElementById('cambiar-direccion').onclick = () => {
    mostrarModalDirecciones(window.direcciones, principal.profile_id);
  };
}

function mostrarModalDirecciones(direcciones, idActual) {
  const modal = document.getElementById('modal-direcciones');
  const lista = document.getElementById('direcciones-list');
  lista.innerHTML = '';

  if (!direcciones || direcciones.length === 0) {
    lista.innerHTML = '<p>No tienes direcciones guardadas.</p>';
    return;
  }

  direcciones.forEach(dir => {
    const div = document.createElement('div');
    div.className = 'direccion-card';
    div.style.border = dir.profile_id === idActual ? '2px solid #1976d2' : '1px solid #ccc';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <div class="direccion-info">
        <strong>${dir.first_name} ${dir.last_name}</strong>
        <span class="telefono">${dir.phone || ''}</span><br>
        ${dir.address} ${dir.department ? dir.department : ''}<br>
        ${dir.city} ${dir.state} United States ${dir.postal_code}<br>
        <button class="seleccionar-direccion" data-id="${dir.profile_id}">Seleccionar</button>
        <button class="borrar-direccion" data-id="${dir.profile_id}" style="margin-left: 10px; color: red;">Borrar</button>
      </div>
    `;
    lista.appendChild(div);
  });

  // Evento para seleccionar dirección
  lista.querySelectorAll('.seleccionar-direccion').forEach(btn => {
    btn.onclick = async () => {
      const idSeleccionado = btn.getAttribute('data-id');
      try {
        const res = await fetch(`/api/users/profiles/${idSeleccionado}/set-default`, {
          method: 'PUT',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Error al establecer dirección predeterminada');

        // Actualizar la variable global direcciones con la nueva orden
        const nuevaPrincipal = window.direcciones.find(d => d.profile_id == idSeleccionado);
        const otras = window.direcciones.filter(d => d.profile_id != idSeleccionado);
        window.direcciones = [nuevaPrincipal, ...otras];

        mostrarDireccionPrincipal(window.direcciones);
        modal.style.display = 'none';
      } catch (error) {
        console.error(error);
        alert('No se pudo cambiar la dirección predeterminada.');
      }
    };
  });

  // Evento para borrar dirección
  lista.querySelectorAll('.borrar-direccion').forEach(btn => {
    btn.onclick = async () => {
      const idBorrar = btn.getAttribute('data-id');
      if (!confirm('¿Estás seguro de que quieres borrar esta dirección?')) return;

      try {
        const res = await fetch(`/api/users/profiles/${idBorrar}`, {  // corregí la ruta aquí
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Error al borrar dirección');

        // Actualizar la variable global eliminando la dirección borrada
        window.direcciones = window.direcciones.filter(d => d.profile_id != idBorrar);

        mostrarModalDirecciones(window.direcciones, idActual === idBorrar ? (window.direcciones[0]?.profile_id || null) : idActual);
        mostrarDireccionPrincipal(window.direcciones);
      } catch (error) {
        console.error(error);
        alert('No se pudo borrar la dirección.');
      }
    };
  });

  modal.style.display = 'block';
}
