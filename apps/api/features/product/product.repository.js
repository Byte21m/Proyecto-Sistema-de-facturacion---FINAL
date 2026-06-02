import db from '../../db/index.js';

/**
 * Crea un producto en la base de datos
 * @param {Object} payload
 * @param {string} payload.nombre
 * @param {number} payload.precio_dolar
 * @param {number} payload.stock
 * @param {boolean} payload.exento_iva
 * @param {number} payload.user_id
 * @returns {Object} El producto creado
 */
const createProduct = async ({ nombre, precio_dolar, stock, exento_iva = false, user_id }) => {
  const statement = db.prepare(`
    INSERT INTO products (nombre, precio_dolar, stock, exento_iva, user_id)
    VALUES (?, ?, ?, ?, ?) RETURNING *
  `);
  return statement.get(nombre, precio_dolar, stock, exento_iva ? 1 : 0, user_id);
};

/**
 * Obtiene todos los productos de un usuario
 * @returns {Array} Listado de productos
 */
const findProducts = (user_id) => {
  const statement = db.prepare(`
    SELECT p.*, 
           EXISTS(SELECT 1 FROM sale_details sd WHERE sd.id_producto = p.id) as tiene_ventas
    FROM products p 
    WHERE p.user_id = ? AND p.is_deleted = 0
  `);
  return statement.all(user_id);
};

/**
 * Encuentra un producto por ID y Usuario
 */
const findProductById = (id, user_id) => {
  const statement = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ? AND is_deleted = 0');
  return statement.get(id, user_id);
};

/**
 * Actualiza un producto de un usuario
 */
const updateProduct = (id, user_id, { nombre, precio_dolar, stock, exento_iva }) => {
  const statement = db.prepare(`
    UPDATE products 
    SET nombre = ?, precio_dolar = ?, stock = ?, exento_iva = ?
    WHERE id = ? AND user_id = ? AND is_deleted = 0 RETURNING *
  `);
  return statement.get(nombre, precio_dolar, stock, exento_iva ? 1 : 0, id, user_id);
};

/**
 * Elimina (soft delete) un producto de un usuario
 */
const deleteProduct = (id, user_id) => {
  const timestamp = Date.now();
  const statement = db.prepare(`
    UPDATE products 
    SET is_deleted = 1, nombre = nombre || ' (eliminado ' || ? || ')' 
    WHERE id = ? AND user_id = ?
  `);
  return statement.run(timestamp, id, user_id);
};

const productRepository = {
  createProduct,
  findProducts,
  findProductById,
  updateProduct,
  deleteProduct,
};

export default productRepository;
