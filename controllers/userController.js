module.exports = { 
    getAllUsers: (req, res) => {
        const db = require('../db/db');
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    },
    getUserById: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    },
    getAllUsersWithProfiles: (req, res) => {
    const db = require('../db/db');
    const sql = `
        SELECT 
            users.id, users.username, users.email, users.role, users.created_at,
            user_profiles.first_name, user_profiles.last_name, user_profiles.address, 
            user_profiles.department, user_profiles.city, user_profiles.state, 
            user_profiles.postal_code, user_profiles.phone, user_profiles.is_default
        FROM users
        LEFT JOIN user_profiles ON users.id = user_profiles.user_id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
}
,
    addUser: (req, res) => {
        const db = require('../db/db');
        const { username, password, email } = req.body;
        db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ id: this.lastID });
        });
    },
    updateUser: (req, res) => {
  const db = require('../db/db');
  const id = req.params.id;
  const { username, password, email } = req.body;

  // Construir dinámicamente la consulta y parámetros según campos recibidos
  const fields = [];
  const values = [];

  if (username) {
    fields.push('username = ?');
    values.push(username);
  }
  if (password) {
    fields.push('password = ?');
    values.push(password);
  }
  if (email) {
    fields.push('email = ?');
    values.push(email);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }

  values.push(id);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ updatedID: id });
  });
},

changePassword: (req, res) => {
  const db = require('../db/db');
  const id = req.params.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // 1. Obtener la contraseña actual almacenada (hasheada)
  db.get('SELECT password FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 2. Validar currentPassword con la almacenada (ejemplo usando bcrypt)
    const bcrypt = require('bcrypt');
    bcrypt.compare(currentPassword, row.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

      // 3. Hashear la nueva contraseña y actualizar
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
},


    deleteUser: (req, res) => {
        const db = require('../db/db');
        const id = req.params.id;
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ deletedID: id });
        });
    },
    addprofile: (req, res) => {
        const db = require('../db/db');
        const { user_id, first_name, last_name, address, department, city, state, postal_code, phone } = req.body;
        db.run('INSERT INTO user_profiles (user_id, first_name, last_name, address, department, city, state, postal_code, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [user_id, first_name, last_name, address, department, city, state, postal_code, phone], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ profileID: this.lastID });
        });
    },
    getProfileByUserId: (req, res) => {
        const db = require('../db/db');
        const user_id = req.params.user_id;
        db.all(
            'SELECT * FROM user_profiles WHERE user_id = ? ORDER BY is_default DESC',
            [user_id],
            (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
            }
    );
    },
    getProfileByprofile_id: (req, res) => {
        const db = require('../db/db');
        const profile_id = req.params.profile_id;
        db.get('SELECT * FROM user_profiles WHERE profile_id = ?', [profile_id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row);
        });
    },
    getProfileAll: (req, res) => {
        const db = require('../db/db');
        
        db.all('SELECT * FROM user_profiles', [] ,(err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    },

    deleteProfile: (req, res) => {
    const db = require('../db/db');
    const profile_id = req.params.profile_id;  // Id del perfil a borrar
    db.run('DELETE FROM user_profiles WHERE profile_id = ?', [profile_id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Perfil no encontrado' });
            return;
        }
        res.json({ message: 'Perfil borrado correctamente' });
    });
},

  setDefaultProfile: (req, res) => {
  const db = require('../db/db');
  const userId = req.user.id; // Asumiendo que usas middleware que setea req.user
  const profileId = req.params.profile_id;

  db.serialize(() => {
    // 1. Verificar que el perfil existe y pertenece al usuario
    db.get(
      'SELECT * FROM user_profiles WHERE profile_id = ? AND user_id = ?',
      [profileId, userId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ message: 'Perfil no encontrado o no pertenece al usuario' });
        }

        // 2. Iniciar transacción
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // 3. Desmarcar todas las direcciones del usuario como no predeterminadas
          db.run(
            'UPDATE user_profiles SET is_default = 0 WHERE user_id = ?',
            [userId],
            function(err) {
              if (err) {
                return db.run('ROLLBACK', () => {
                  res.status(500).json({ error: err.message });
                });
              }

              // 4. Marcar la dirección seleccionada como predeterminada
              db.run(
                'UPDATE user_profiles SET is_default = 1 WHERE profile_id = ? AND user_id = ?',
                [profileId, userId],
                function(err) {
                  if (err) {
                    return db.run('ROLLBACK', () => {
                      res.status(500).json({ error: err.message });
                    });
                  }

                  // 5. Confirmar transacción
                  db.run('COMMIT', (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({ message: 'Dirección predeterminada actualizada' });
                  });
                }
              );
            }
          );
        });
      }
    );
  });
}
,


updateProfile: (req, res) => {
    const db = require('../db/db');
    const profileID = req.params.profile_id;
    const { first_name, last_name, address, department, city, state, postal_code, phone } = req.body;

    db.run(
        `UPDATE user_profiles SET 
            first_name = ?, 
            last_name = ?, 
            address = ?, 
            department = ?, 
            city = ?, 
            state = ?, 
            postal_code = ?, 
            phone = ?
         WHERE profile_id = ?`,
        [first_name, last_name, address, department, city, state, postal_code, phone, profileID],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Perfil no encontrado' });
                return;
            }
            res.json({ message: 'Perfil actualizado correctamente' });
        }
    );
},


    
};




