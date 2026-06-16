import supabase from '../../db/index.js';

/**
 * Crea un producto en Supabase
 * @param {Object} payload
 * @param {string} payload.nombre
 * @param {number} payload.precio_dolar
 * @param {number} payload.stock
 * @param {boolean} payload.exento_iva
 * @param {number} payload.user_id
 * @returns {Promise<Object>} El producto creado
 */
const createProduct = async ({ nombre, precio_dolar, stock, exento_iva = false, user_id }) => {
  const { data, error } = await supabase
    .from('products')
    .insert({ nombre, precio_dolar, stock, exento_iva, user_id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Obtiene todos los productos de un usuario
 * @param {number} user_id
 * @returns {Promise<Array>} Listado de productos
 */
const findProducts = async (user_id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, sale_details(id_producto)')
    .eq('user_id', user_id)
    .eq('is_deleted', false);

  if (error) throw error;

  return (data || []).map(p => {
    const { sale_details, ...rest } = p;
    return {
      ...rest,
      tiene_ventas: sale_details && sale_details.length > 0,
    };
  });
};

/**
 * Encuentra un producto por ID y Usuario
 * @param {number} id
 * @param {number} user_id
 * @returns {Promise<Object|null>}
 */
const findProductById = async (id, user_id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Actualiza un producto de un usuario
 * @param {number} id
 * @param {number} user_id
 * @param {Object} data
 * @param {string} data.nombre
 * @param {number} data.precio_dolar
 * @param {number} data.stock
 * @param {boolean} data.exento_iva
 * @returns {Promise<Object>}
 */
const updateProduct = async (id, user_id, { nombre, precio_dolar, stock, exento_iva }) => {
  const { data, error } = await supabase
    .from('products')
    .update({ nombre, precio_dolar, stock, exento_iva })
    .eq('id', id)
    .eq('user_id', user_id)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina (soft delete) un producto de un usuario
 * @param {number} id
 * @param {number} user_id
 * @returns {Promise<void>}
 */
const deleteProduct = async (id, user_id) => {
  const timestamp = Date.now();
  const product = await findProductById(id, user_id);
  if (!product) throw new Error('Producto no encontrado');

  const { error } = await supabase
    .from('products')
    .update({
      is_deleted: true,
      nombre: `${product.nombre} (eliminado ${timestamp})`,
    })
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) throw error;
};

const productRepository = {
  createProduct,
  findProducts,
  findProductById,
  updateProduct,
  deleteProduct,
};

export default productRepository;
