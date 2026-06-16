import supabase from '../../db/index.js';

/** @typedef {Object} Session */

/**
 * Crea una sesión en Supabase
 * @param {Object} payload
 * @param {string} payload.jwtid
 * @param {number} payload.userId
 * @returns {Promise<Session>} La sesión creada
 */
const createSession = async ({ jwtid, userId }) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ jwtid, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Busca una sesión por jwtid
 * @param {Object} payload
 * @param {string} payload.jwtid
 * @returns {Promise<Session|null>}
 */
const findSessionByJwtId = async ({ jwtid }) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('jwtid', jwtid)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Actualiza el jwtid de una sesión
 * @param {Object} payload
 * @param {string} payload.jwtid
 * @param {number} payload.id
 * @returns {Promise<void>}
 */
const updateSessionJwtId = async ({ jwtid, id }) => {
  const { error } = await supabase
    .from('sessions')
    .update({ jwtid })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Elimina una sesión por su id
 * @param {number} id
 * @returns {Promise<void>}
 */
const deleteSession = async (id) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Elimina todas las sesiones de un usuario
 * @param {number} userId
 * @returns {Promise<void>}
 */
const deleteAllSessionsByUserId = async (userId) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};

const authRepository = {
  createSession,
  findSessionByJwtId,
  updateSessionJwtId,
  deleteSession,
  deleteAllSessionsByUserId,
};

export default authRepository;
