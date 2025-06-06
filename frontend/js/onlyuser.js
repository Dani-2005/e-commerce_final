fetch('/api/check', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    if (!data.authenticated) {
      alert('Debes iniciar sesión para acceder a esta página.');
      window.location.href = '/pages/login.html'; // Redirige al login si NO está autenticado
    }
  });