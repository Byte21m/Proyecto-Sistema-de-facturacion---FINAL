import db from '../../db/index.js';

/**
 * Crea un producto en la base de datos
 * @param {Object} payload
 * @param {string} payload.nombre
 * @param {number} payload.precio_dolar
 * @param {number} payload.stock
 * @returns {Object} El producto creado
 */
const createProduct = async ({ nombre, precio_dolar, stock }) => {
  const statement = db.prepare(`
    INSERT INTO products (nombre, precio_dolar, stock)
    VALUES (?, ?, ?) RETURNING *
  `);
  return statement.get(nombre, precio_dolar, stock);
};

/**
 * Obtiene todos los productos
 * @returns {Array} Listado de productos
 */
const findProducts = () => {
  const statement = db.prepare('SELECT * FROM products');
  return statement.all();
};

/**
 * Encuentra un producto por ID
 */
const findProductById = (id) => {
  const statement = db.prepare('SELECT * FROM products WHERE id = ?');
  return statement.get(id);
};

/**
 * Actualiza un producto
 */
const updateProduct = (id, { nombre, precio_dolar, stock }) => {
  const statement = db.prepare(`
    UPDATE products 
    SET nombre = ?, precio_dolar = ?, stock = ?
    WHERE id = ? RETURNING *
  `);
  return statement.get(nombre, precio_dolar, stock, id);
};

/**
 * Elimina un producto
 */
const deleteProduct = (id) => {
  const statement = db.prepare('DELETE FROM products WHERE id = ?');
  return statement.run(id);
};

const productRepository = {
  createProduct,
  findProducts,
  findProductById,
  updateProduct,
  deleteProduct,
};

export default productRepository;
