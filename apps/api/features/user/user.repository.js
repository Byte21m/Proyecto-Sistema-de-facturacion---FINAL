import db from '../../db/index.js';

/** @typedef {import('./user.schemas.js').User} User */

/**
 * Crea un usuario en la base de datos
 * @param {Object} payload
 * @param {User['email']} payload.email - El correo del usuario
 * @param {User['password_hash']} payload.passwordHash - La contraseña encriptada
 * @returns {Promise<User>} El usuario creado
 */
const createUser = async ({ email, passwordHash }) => {
  const createUserQuery = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?) RETURNING *
  `);
  const createdUser = createUserQuery.get(email, passwordHash);
  return createdUser;
};

/**
 * Crea un usuario en la base de datos
 * @param {User['id']} id - El id del usuario a eliminar
 * @returns {void}
 */
const deleteUserById = (id) => {
  const deleteUserQuery = db.prepare('DELETE FROM users WHERE id = ?');
  deleteUserQuery.run(id);
};

/**
 * Crea un usuario en la base de datos
 * @param {User['email']} email - El correo del usuario
 * @returns {User} El usuario encontrado
 */
const findUserByEmail = (email) => {
  const findUserQuery = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = findUserQuery.get(email);
  return user;
};

/**
 * Obtener todos los usuarios
 * @returns {User[]} Los usuarios encontrados
 */
const findUsers = () => {
  const findUsersQuery = db.prepare('SELECT * FROM users');
  const users = findUsersQuery.all();
  return users;
};

/**
 * Actualiza la propiedad del email de los usuarios
 * @param {string} Id - El id del usuario a actualizar
 * @returns {void}
 */
const updateEmailVerify = (id) => {
  const updateEmailVerifyQuery = db.prepare(`
    UPDATE users 
    SET email_verified = 1
    WHERE id = ?
  `);
  updateEmailVerifyQuery.run(id);
};

/**
 * Actualiza la contraseña del usuario
 * @param {string} id - El id del usuario a actualizar
 * @param {string} passwordHash - El hash de la nueva contraseña
 * @returns {void}
 */
const updatePassword = (id, passwordHash) => {
  const updatePasswordQuery = db.prepare(`
    UPDATE users 
    SET password_hash = ?
    WHERE id = ?
  `);
  updatePasswordQuery.run(passwordHash, id);
};

const userRepository = {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUsers,
  updateEmailVerify,
  updatePassword,
};

export default userRepository;
