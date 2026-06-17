import supabase from '../../db/index.js';

/** @typedef {Object} User */

/**
 * Crea un usuario en la base de datos junto con su perfil de negocio
 * @param {Object} payload
 * @param {string} payload.nombre
 * @param {string} payload.email
 * @param {string} payload.passwordHash
 * @param {string} payload.razon_social
 * @param {string|null} [payload.rif]
 * @returns {Promise<User>} El usuario creado
 */
const createUser = async ({ nombre, email, passwordHash, razon_social, rif, email_verified }) => {
  const insertData = { nombre, email, password_hash: passwordHash };
  if (email_verified !== undefined) {
    insertData.email_verified = email_verified;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert(insertData)
    .select()
    .single();

  if (userError) throw userError;

  const { error: profileError } = await supabase
    .from('business_profile')
    .insert({ user_id: user.id, razon_social, rif: rif || '' });

  if (profileError) {
    // Si falla el perfil, eliminamos el usuario para simular Rollback
    await supabase.from('users').delete().eq('id', user.id);
    throw profileError;
  }

  return user;
};

/**
 * Elimina un usuario de la base de datos
 * @param {number} id
 * @returns {Promise<void>}
 */
const deleteUserById = async (id) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

/**
 * Busca un usuario por correo
 * @param {string} email
 * @returns {Promise<User|null>}
 */
const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Obtiene todos los usuarios
 * @returns {Promise<User[]>}
 */
const findUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  if (error) throw error;
  return data;
};

/**
 * Actualiza la verificación del correo
 * @param {number} id
 * @returns {Promise<void>}
 */
const updateEmailVerify = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ email_verified: true })
    .eq('id', id);
  if (error) throw error;
};

/**
 * Actualiza la contraseña del usuario
 * @param {number} id
 * @param {string} passwordHash
 * @returns {Promise<void>}
 */
const updatePassword = async (id, passwordHash) => {
  const { error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', id);
  if (error) throw error;
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
