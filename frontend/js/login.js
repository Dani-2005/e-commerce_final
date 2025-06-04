function initLogin() {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const profileBtn = document.getElementById("profile-btn");

    if (!loginBtn || !registerBtn || !logoutBtn || !profileBtn) return;

    // Verificar sesión con cookies (JWT)
    const cookies = document.cookie.split("; ");
    const jwtCookie = cookies.find(row => row.startsWith("jwt="));

    if (jwtCookie) {
        logoutBtn.style.display = "block";
        profileBtn.style.display = "block";
        loginBtn.style.display = "none";
        registerBtn.style.display = "none";
    } else {
        loginBtn.style.display = "block";
        registerBtn.style.display = "block";
        logoutBtn.style.display = "none";
        profileBtn.style.display = "none";
    }

    loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });

    registerBtn.addEventListener("click", () => {
        window.location.href = "register.html";
    });

    logoutBtn.addEventListener("click", () => {
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    });

    profileBtn.addEventListener("click", () => {
        window.location.href = "profile.html"; // Cambia esta ruta si es necesario
    });
}

window.initLogin = initLogin;