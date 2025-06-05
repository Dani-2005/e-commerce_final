document.addEventListener('DOMContentLoaded', async () => {
    const user_id = sessionStorage.getItem('user_id');
    if (!user_id) {
        alert('Error: No se encontró el ID del usuario.');
        return;
    }

    try {
        const res = await fetch(`/api/users/profile/id?user_id=${user_id}`);
        if (res.ok) {
            const profile = await res.json();
            if (profile) {
                // Mostrar datos del perfil
                mostrarPerfil(profile);
            } else {
                // No hay perfil, mostrar formulario vacío
                mostrarFormulario();
            }
        } else {
            alert('Error al obtener perfil.');
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        alert('Error al conectarse al servidor.');
    }
});

function mostrarPerfil(profile) {
    // Ocultar formulario y mostrar datos
    document.getElementById('profileForm').style.display = 'none';

    const profileDiv = document.getElementById('profileDisplay');
    profileDiv.innerHTML = `
        <p>Nombre: ${profile.first_name} ${profile.last_name}</p>
        <p>Dirección: ${profile.address}</p>
        <p>Departamento: ${profile.department}</p>
        <p>Ciudad: ${profile.city}</p>
        <p>Estado: ${profile.state}</p>
        <p>Código Postal: ${profile.postal_code}</p>
        <p>Teléfono: ${profile.phone}</p>
        <button id="editBtn">Editar</button>
    `;
    profileDiv.style.display = 'block';

    document.getElementById('editBtn').addEventListener('click', () => {
        profileDiv.style.display = 'none';
        llenarFormulario(profile);
        document.getElementById('profileForm').style.display = 'block';
    });
}

function mostrarFormulario() {
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('profileDisplay').style.display = 'none';
}

function llenarFormulario(profile) {
    const form = document.getElementById('profileForm');
    form.nombre.value = profile.first_name;
    form.apellido.value = profile.last_name;
    form.direccion.value = profile.address;
    form.direccion2.value = profile.department;
    form.ciudad.value = profile.city;
    form.estado.value = profile.state;
    form.codigo_postal.value = profile.postal_code;
    form.telefono.value = profile.phone;
}

