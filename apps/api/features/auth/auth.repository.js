import db from '../../db/index.js';

/** @typedef {import('./auth.schemas.js').Session} Session */

/**
 * Crea una session en la base de datos
 * @param {Object} payload - El payload para crear la session
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @param {Session['user_id']} payload.userId - El id del usuario
 * @returns {Session} La session creada
 */
const createSession = ({ jwtid, userId }) => {
  const insertTokenQuery = db.prepare(
    'INSERT INTO sessions (jwtid, user_id) VALUES (?,?) RETURNING *',
  );
  const createdSession = insertTokenQuery.get(jwtid, userId);
  return createdSession;
};

/**
 * Busca una session por el id del refresh token
 * @param {Object} payload - El payload para buscar la session
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @returns {Session} La session encontrada
 */
const findSessionByJwtId = ({ jwtid }) => {
  const findSessionQuery = db.prepare('SELECT * FROM sessions WHERE jwtid = ?');
  const session = findSessionQuery.get(jwtid);
  return session;
};

/**
 * Actualiza el id del token de la session
 * @param {Object} payload
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @param {Session['id']} payload.id - El id de la session a actualizar
 * @returns {void}
 */
const updateSessionJwtId = ({ jwtid, id }) => {
  const updateSessionQuery = db.prepare(`
    UPDATE sessions
    SET jwtid = ?
    WHERE id = ?
  `);

  updateSessionQuery.run(jwtid, id);
};

/**
 * Elimina una session por el id
 * @param {string} id - El id de la session a eliminar
 * @returns {void}
 */
const deleteSession = (id) => {
  const deleteSessionQuery = db.prepare('DELETE FROM sessions WHERE id = ?');
  deleteSessionQuery.run(id);
};

/**
 * Elimina todas las sesiones de un usuario
 * @param {string} userId - El id del usuario
 * @returns {void}
 */
const deleteAllSessionsByUserId = (userId) => {
  const deleteSessionsQuery = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  deleteSessionsQuery.run(userId);
};

const authRepository = { createSession, findSessionByJwtId, updateSessionJwtId, deleteSession, deleteAllSessionsByUserId };
export default authRepository;
