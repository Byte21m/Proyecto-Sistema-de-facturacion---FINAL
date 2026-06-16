import supabase from '../../db/index.js';

/**
 * Crea o actualiza el perfil comercial de un usuario en Supabase
 * @param {number} userId
 * @param {Object} data
 * @param {string} data.razon_social
 * @param {string} data.rif
 * @param {string} [data.direccion]
 * @param {string} [data.telefono]
 * @returns {Promise<Object>} El perfil comercial
 */
const createOrUpdateProfile = async (userId, { razon_social, rif, direccion, telefono }) => {
  const { data, error } = await supabase
    .from('business_profile')
    .upsert({
      user_id: userId,
      razon_social,
      rif,
      direccion: direccion || null,
      telefono: telefono || null,
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Obtiene el perfil comercial de un usuario
 * @param {number} userId
 * @returns {Promise<Object|null>} El perfil comercial
 */
const findProfileByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('business_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const businessRepository = {
  createOrUpdateProfile,
  findProfileByUserId,
};

export default businessRepository;
