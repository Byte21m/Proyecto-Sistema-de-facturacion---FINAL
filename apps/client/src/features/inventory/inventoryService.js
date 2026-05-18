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
 * @param {boolean} [payload.exento_iva]
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

/**
 * Carga el historial de ventas
 */
const getSalesHistory = async () => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get('/api/sale/history/items').json();
    return data;
  } catch (err) {
    console.error('Error cargando historial:', err);
    return [];
  }
};

/**
 * Carga todas las ventas (facturas emitidas)
 */
const getSales = async () => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get('/api/sale').json();
    return data;
  } catch (err) {
    console.error('Error cargando ventas:', err);
    return [];
  }
};

/**
 * Obtiene los detalles de una factura específica
 */
const getSaleById = async (id) => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get(`/api/sale/${id}`).json();
    return data;
  } catch (err) {
    console.error('Error cargando detalles de venta:', err);
    return null;
  }
};

/**
 * Obtiene el perfil comercial del usuario autenticado
 */
const getBusinessProfile = async () => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get('/api/user/business').json();
    return data;
  } catch (err) {
    console.error('Error cargando perfil comercial:', err);
    return null;
  }
};

/**
 * Crea o actualiza el perfil comercial
 */
const updateBusinessProfile = async (data) => {
  try {
    const privateKy = getPrivateKy();
    const result = await privateKy.put('/api/user/business', { json: data }).json();
    return result;
  } catch (err) {
    console.error('Error actualizando perfil comercial:', err);
    return null;
  }
};

/**
 * Envía la factura por correo electrónico
 * @param {number} saleId - ID de la venta
 * @param {string} email - Correo del destinatario
 */
const sendInvoiceEmail = async (saleId, email) => {
  try {
    const privateKy = getPrivateKy();
    const result = await privateKy.post(`/api/sale/${saleId}/invoice/email`, { json: { email } }).json();
    return result;
  } catch (err) {
    console.error('Error enviando factura por correo:', err);
    return null;
  }
};

/**
 * Obtiene el reporte mensual de IVA
 * @param {number} year
 * @param {number} month
 */
const getMonthlyReport = async (year, month) => {
  try {
    const privateKy = getPrivateKy();
    const data = await privateKy.get(`/api/sale/report/monthly?year=${year}&month=${month}`).json();
    return data;
  } catch (err) {
    console.error('Error cargando reporte mensual:', err);
    return null;
  }
};

const inventoryService = {
  addProduct,
  getInventory,
  deleteProduct,
  updateProduct,
  loadInventoryFromServer,
  getSalesHistory,
  getSales,
  getSaleById,
  getBusinessProfile,
  updateBusinessProfile,
  sendInvoiceEmail,
  getMonthlyReport,
};

export default inventoryService;
