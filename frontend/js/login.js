function initLogin() {
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (!loginBtn || !registerBtn || !logoutBtn) return;

    // Verificar sesión con cookies (JWT)
    const cookies = document.cookie.split("; ");
    const jwtCookie = cookies.find(row => row.startsWith("jwt="));

    if (jwtCookie) {
        logoutBtn.style.display = "block";
        loginBtn.style.display = "none";
        registerBtn.style.display = "none";
    } else {
        loginBtn.style.display = "block";
        registerBtn.style.display = "block";
        logoutBtn.style.display = "none";
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
}

window.initLogin = initLogin;