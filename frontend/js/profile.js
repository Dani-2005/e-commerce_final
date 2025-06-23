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

    // --- INICIO: Fetch para sidebar ---
    // Obtén los datos del usuario para el sidebar
    const sidebarRes = await fetch(`/api/users/${user_id}`, { credentials: 'include' });
    if (sidebarRes.ok) {
      const sidebarData = await sidebarRes.json();
      document.getElementById('name').textContent = sidebarData.username
      document.getElementById('email').textContent = sidebarData.email;
      const userImgDiv = document.querySelector('.user-img');
      if (sidebarData.fotoPerfil) {
        // Si hay foto, puedes mostrarla como fondo o usar <img> si prefieres
        userImgDiv.style.backgroundImage = `url('${sidebarData.fotoPerfil}')`;
        userImgDiv.textContent = ''; // Borra letra si hay imagen
      } else if (sidebarData.email) {
        // Si no hay foto, muestra la primera letra del email
        userImgDiv.textContent = sidebarData.email.charAt(0).toUpperCase();
        userImgDiv.style.backgroundImage = ''; // Borra imagen si no hay
      }

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
        const res = await fetch(`/api/users/profile/${idBorrar}`, {  // corregí la ruta aquí
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

// Admnistrador de cuenta


document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const field = btn.dataset.field;
    btn.style.display = 'none';
    document.getElementById(field + '-text').style.display = 'none';
    const form = document.querySelector(`form.edit-form[data-field="${field}"]`);
    form.style.display = 'inline-block';
  });
});

document.querySelectorAll('.cancel-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.closest('form');
    const field = form.dataset.field;
    form.style.display = 'none';
    document.getElementById(field + '-text').style.display = 'inline';
    document.querySelector(`button.edit-btn[data-field="${field}"]`).style.display = 'inline';
  });
});

document.querySelectorAll('.togglePassword').forEach(button => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const passwordInput = document.getElementById(targetId);
    if (!passwordInput) return;

    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Cambiar título y estilo del botón
    button.title = type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña';
    button.style.color = type === 'password' ? '#666' : '#000';
  });
});

document.querySelectorAll('.edit-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const field = form.dataset.field;
    const user_id = sessionStorage.getItem('user_id');
    if (!user_id) {
      alert('Usuario no autenticado');
      return;
    }

    if (field === 'password') {
      const currentPassword = form.querySelector('input[name="currentPassword"]').value.trim();
      const newPassword = form.querySelector('input[name="newPassword"]').value.trim();
      const confirmPassword = form.querySelector('input[name="confirmPassword"]').value.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Por favor, completa todos los campos de contraseña.');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('La nueva contraseña y la confirmación no coinciden.');
        return;
      }

      // Validación de la nueva contraseña con regex
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        alert('La contraseña debe tener al menos 6 caracteres y contener una mayúscula, una minúscula, un número y un carácter especial.');
        return;
      }

      try {
        const res = await fetch(`/api/users/${user_id}/change-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Error response del servidor:', errorData);
          throw new Error(errorData.message || 'Error al cambiar la contraseña');
        }

        alert('Contraseña actualizada correctamente');
        form.style.display = 'none';
        document.getElementById(field + '-text').style.display = 'inline';
        document.querySelector(`button.edit-btn[data-field="${field}"]`).style.display = 'inline';
        form.reset();

      } catch (error) {
        alert(error.message,'intente de nuevo');
      }
    } else {
      // Para email y username
      const input = form.querySelector('input');
      const newValue = input.value.trim();
      if (!newValue) {
        alert('El campo no puede estar vacío.');
        return;
      }

      try {
        const body = {};
        if (field === 'email') body.email = newValue;
        if (field === 'username') body.username = newValue;

        const res = await fetch(`/api/users/${user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Error al actualizar');

        document.getElementById(field + '-text').textContent = newValue;
        form.style.display = 'none';
        document.getElementById(field + '-text').style.display = 'inline';
        document.querySelector(`button.edit-btn[data-field="${field}"]`).style.display = 'inline';

        alert('Actualizado correctamente');
      } catch (error) {
        alert('No se pudo actualizar. Intenta de nuevo.');
      }
    }
  });
});


