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
  const statement = db.prepare('SELECT * FROM products WHERE user_id = ?');
  return statement.all(user_id);
};

/**
 * Encuentra un producto por ID y Usuario
 */
const findProductById = (id, user_id) => {
  const statement = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?');
  return statement.get(id, user_id);
};

/**
 * Actualiza un producto de un usuario
 */
const updateProduct = (id, user_id, { nombre, precio_dolar, stock, exento_iva }) => {
  const statement = db.prepare(`
    UPDATE products 
    SET nombre = ?, precio_dolar = ?, stock = ?, exento_iva = ?
    WHERE id = ? AND user_id = ? RETURNING *
  `);
  return statement.get(nombre, precio_dolar, stock, exento_iva ? 1 : 0, id, user_id);
};

/**
 * Elimina un producto de un usuario
 */
const deleteProduct = (id, user_id) => {
  const statement = db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
  return statement.run(id, user_id);
};

const productRepository = {
  createProduct,
  findProducts,
  findProductById,
  updateProduct,
  deleteProduct,
};

export default productRepository;
