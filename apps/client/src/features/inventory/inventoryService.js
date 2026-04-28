import { atom } from 'nanostores';
import { getPrivateKy } from '../auth/auth.service';

/** @typedef {import('./schemas').Product} Product */
/** @type {Product[]} */
let productsArray = [];
export const inventoryStore = atom(productsArray);

/**
 * Añade un nuevo producto al inventario
 * @param {object} payload
 * @param {string} payload.nombre
 * @param {number} payload.precio_dolar
 * @param {number} payload.stock
 */
const addProduct = async (payload) => {
  const privateKy = getPrivateKy();
  const data = await privateKy.post('/api/product', { json: payload }).json();
  const products = inventoryStore.get();
  inventoryStore.set(products.concat(data));
};

/**
 * Obtiene los productos del store local
 */
const getInventory = () => {
  return inventoryStore.get();
};

/**
 * Elimina un producto por ID
 */
const deleteProduct = async (id) => {
  const privateKy = getPrivateKy();
  await privateKy.delete(`/api/product/${id}`);
  const products = inventoryStore.get();
  inventoryStore.set(products.filter((p) => p.id !== id));
};

/**
 * Actualiza la información de un producto
 */
const updateProduct = async (id, payload) => {
  const privateKy = getPrivateKy();
  const updated = await privateKy.put(`/api/product/${id}`, { json: payload }).json();
  const products = inventoryStore.get();
  inventoryStore.set(products.map((p) => (p.id === id ? { ...updated, isEditing: false } : p)));
};

/**
 * Carga el inventario completo desde el servidor
 */
const loadInventoryFromServer = async () => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get('/api/product').json();
    inventoryStore.set(data);
  } catch (err) {
    console.error('Error cargando inventario:', err);
    inventoryStore.set([]);
  }
};

const inventoryService = {
  addProduct,
  getInventory,
  deleteProduct,
  updateProduct,
  loadInventoryFromServer,
};

export default inventoryService;
