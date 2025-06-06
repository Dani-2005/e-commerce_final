document.addEventListener('DOMContentLoaded', async () => {
    const user_id = sessionStorage.getItem('user_id');
    if (!user_id) {
        alert('Error: No se encontró el ID del usuario.');
        return;
    }

    try {
        const res = await fetch(`/api/users/profiles/${user_id}`);
        if (res.ok) {
            const direcciones = await res.json();
            mostrarDirecciones(direcciones);
        } else {
            alert('Error al obtener direcciones.');
        }
    } catch (error) {
        console.error('Error al cargar direcciones:', error);
        alert('Error al conectarse al servidor.');
    }
});

function mostrarDirecciones(direcciones) {
    const container = document.getElementById('direcciones-list');
    container.innerHTML = '';

    if (!direcciones || direcciones.length === 0) {
        container.innerHTML = '<p>No tienes direcciones guardadas.</p>';
        return;
    }

    direcciones.forEach(dir => {
        const div = document.createElement('div');
        div.className = 'direccion-card';
        div.innerHTML = `
            <div class="direccion-banda"></div>
            <div class="direccion-info">
                <strong>${dir.first_name} ${dir.last_name}</strong>
                <span class="telefono">${dir.phone || ''}</span><br>
                ${dir.address} ${dir.department ? dir.department : ''}<br>
                ${dir.city} ${dir.state} United States ${dir.postal_code}<br>
                <div class="direccion-acciones">
                    <a href="#" class="borrar" data-id="${dir.profile_id}">Borrar</a>
                    <a href="#" class="editar" data-id="${dir.profile_id}">Editar</a>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    // Agregar event listeners para borrar
    document.querySelectorAll('.borrar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const profile_id = e.target.getAttribute('data-id');
            if (confirm('¿Seguro que quieres borrar esta dirección?')) {
                try {
                    const res = await fetch(`/api/users/profile/${profile_id}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        alert('Dirección borrada correctamente.');
                        // Recargar la lista
                        location.reload();
                    } else {
                        const error = await res.json();
                        alert('Error al borrar: ' + error.error);
                    }
                } catch (error) {
                    console.error('Error al borrar dirección:', error);
                    alert('Error al conectarse al servidor.');
                }
            }
        });
    });

    // Agregar event listeners para editar
    document.querySelectorAll('.editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const profile_id = e.target.getAttribute('data-id');
            // Redirigir a página de edición pasando el id (puedes usar query params)
            window.location.href = `/pages/addprofile.html?id=${profile_id}`;
        });
    });
}
