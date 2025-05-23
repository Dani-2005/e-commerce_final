class User {
  constructor(id, username, password, email) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.email = email;
  }

  // Actualiza la información del usuario
  updateUserInfo(newUsername, newPassword, newEmail) {
    this.username = newUsername;
    this.password = newPassword;
    this.email = newEmail;
  }

  // Simula la eliminación del usuario
  deleteUser() {
    // Aquí iría la lógica real para eliminar de la base de datos
    console.log(`User with ID ${this.id} deleted.`);
  }

  // Devuelve información pública del usuario
  getUserInfo() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
    };
  }

  // Valida credenciales (¡no recomendado comparar contraseñas en texto plano!)
  validateCredentials(inputUsername, inputPassword) {
    return this.username === inputUsername && this.password === inputPassword;
  }

  // Resetea la contraseña
  resetPassword(newPassword) {
    this.password = newPassword;
    console.log(`Password for user ${this.username} has been reset.`);
  }

  // Devuelve el ID del usuario
  getUserId() {
    return this.id;
  }
}

module.exports = User;