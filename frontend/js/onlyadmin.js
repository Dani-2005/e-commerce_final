document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/auth/check-admin", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (!data.authenticated) {
        alert("Debes iniciar sesión como administrador.");
        window.location.href = "login.html";
      } else if (!data.isAdmin) {
        alert("Acceso solo para administradores.");
        window.location.href = "index.html";
      }
      // Si pasa, el usuario es admin y puede ver la página
    })
    .catch(() => {
      alert("Error de autenticación.");
      window.location.href = "login.html";
    });
});