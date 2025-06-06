document.addEventListener('DOMContentLoaded', async () => {
    // Obtener el parámetro id de la URL
    const params = new URLSearchParams(window.location.search);
    const profile_id = params.get('id');

    if (profile_id) {
        // Modo edición: obtener datos y llenar el formulario
        try {
            const res = await fetch(`/api/users/profile/${profile_id}`);
            if (res.ok) {
                const [perfil] = await res.json(); // Suponiendo que la API devuelve un array
                if (perfil) {
                    document.getElementById('nombre').value = perfil.first_name || '';
                    document.getElementById('apellido').value = perfil.last_name || '';
                    document.getElementById('direccion').value = perfil.address || '';
                    document.getElementById('direccion2').value = perfil.department || '';
                    document.getElementById('ciudad').value = perfil.city || '';
                    document.getElementById('estado').value = perfil.state || '';
                    document.getElementById('codigo_postal').value = perfil.postal_code || '';
                    document.getElementById('telefono').value = perfil.phone || '';
                }
            } else {
                alert('No se pudo cargar la dirección para editar.');
            }
        } catch (error) {
            alert('Error al conectarse al servidor.');
        }
    }
});

// Manejo del submit para crear o actualizar
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const params = new URLSearchParams(window.location.search);
    const profile_id = params.get('id');
    const user_id = sessionStorage.getItem('user_id');
    if (!user_id) {
        alert('Error: No se encontró el ID del usuario.');
        return;
    }

    const data = {
        user_id,
        first_name: form.nombre.value,
        last_name: form.apellido.value,
        address: form.direccion.value,
        department: form.direccion2.value,
        city: form.ciudad.value,
        state: form.estado.value,
        postal_code: form.codigo_postal.value,
        phone: form.telefono.value
    };

    try {
        let res, result;
        if (profile_id) {
            // Actualizar (PUT o PATCH según tu API)
            res = await fetch(`/api/users/profile/${profile_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Crear nuevo (POST)
            res = await fetch('/api/users/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        result = await res.json();
        if (res.ok) {
            alert('Perfil guardado correctamente.');
            window.location.href = '/pages/index.html';
        } else {
            alert('Error: ' + (result.error || 'Error desconocido'));
        }
    } catch (error) {
        alert('Error al conectarse al servidor.');
    }
});
