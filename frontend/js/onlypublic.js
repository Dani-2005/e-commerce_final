fetch('/api/check', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    if (data.authenticated) {
      alert('Ya has iniciado sesion .');
      window.location.href = '/pages/index.html'; // Redirige al home o dashboard
    }
  });