import db from '../../db/index.js';

/**
 * Crea o actualiza el perfil comercial de un usuario
 * @param {number} userId
 * @param {Object} data
 * @param {string} data.razon_social
 * @param {string} data.rif
 * @param {string} [data.direccion]
 * @param {string} [data.telefono]
 * @returns {Object} El perfil creado o actualizado
 */
const createOrUpdateProfile = (userId, { razon_social, rif, direccion, telefono }) => {
  const existing = db.prepare('SELECT id FROM business_profile WHERE user_id = ?').get(userId);

  if (existing) {
    const statement = db.prepare(`
      UPDATE business_profile 
      SET razon_social = ?, rif = ?, direccion = ?, telefono = ?
      WHERE user_id = ? RETURNING *
    `);
    return statement.get(razon_social, rif, direccion || null, telefono || null, userId);
  } else {
    const statement = db.prepare(`
      INSERT INTO business_profile (user_id, razon_social, rif, direccion, telefono)
      VALUES (?, ?, ?, ?, ?) RETURNING *
    `);
    return statement.get(userId, razon_social, rif, direccion || null, telefono || null);
  }
};

/**
 * Obtiene el perfil comercial de un usuario
 * @param {number} userId
 * @returns {Object|undefined} El perfil del comercio
 */
const findProfileByUserId = (userId) => {
  return db.prepare('SELECT * FROM business_profile WHERE user_id = ?').get(userId);
};

const businessRepository = {
  createOrUpdateProfile,
  findProfileByUserId,
};

export default businessRepository;
