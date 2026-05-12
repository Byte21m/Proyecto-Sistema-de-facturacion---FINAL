import db from '../../db/index.js';

/**
 * Crea una venta con sus detalles en una transacción
 * @param {Object} params
 * @param {number} params.total_bs - Total en bolívares
 * @param {number} params.id_usuario - ID del usuario que realiza la venta
 * @param {Array} params.items - Detalles de la venta
 * @param {number} params.items[].id_producto
 * @param {number} params.items[].cantidad
 * @param {number} params.items[].precio_momento
 * @param {number} params.items[].tasa_dia
 * @returns {Object} La venta creada con sus detalles
 */
const createSale = (params) => {
  const { total_bs, id_usuario, items } = params;

  const insertSale = db.prepare(`
    INSERT INTO sales (total_bs, id_usuario)
    VALUES (?, ?) RETURNING *
  `);

  const insertDetail = db.prepare(`
    INSERT INTO sale_details (id_venta, id_producto, tasa_dia, cantidad, precio_momento)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateStock = db.prepare(`
    UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
  `);

  const transaction = db.transaction(() => {
    // 1. Crear la venta
    const sale = insertSale.get(total_bs, id_usuario);

    // 2. Insertar cada detalle y actualizar stock
    const details = [];
    for (const item of items) {
      // Verificar y actualizar stock
      const result = updateStock.run(item.cantidad, item.id_producto, item.cantidad);
      if (result.changes === 0) {
        throw new Error(`Stock insuficiente para el producto con ID ${item.id_producto}`);
      }

      insertDetail.run(
        sale.id,
        item.id_producto,
        item.tasa_dia,
        item.cantidad,
        item.precio_momento
      );

      details.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_momento: item.precio_momento,
        tasa_dia: item.tasa_dia,
      });
    }

    return { ...sale, details };
  });

  return transaction();
};

/**
 * Obtiene todas las ventas
 */
const findSales = () => {
  const statement = db.prepare(`
    SELECT s.*, u.email as usuario_email
    FROM sales s
    LEFT JOIN users u ON s.id_usuario = u.id
    ORDER BY s.fecha DESC
  `);
  return statement.all();
};

/**
 * Obtiene las ventas de hoy
 */
const findTodaySales = () => {
  const statement = db.prepare(`
    SELECT s.*, u.email as usuario_email
    FROM sales s
    LEFT JOIN users u ON s.id_usuario = u.id
    WHERE date(s.fecha) = date('now')
    ORDER BY s.fecha DESC
  `);
  return statement.all();
};

/**
 * Obtiene una venta por ID con sus detalles
 */
const findSaleById = (id) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
  if (!sale) return null;

  const details = db.prepare(`
    SELECT sd.*, p.nombre as producto_nombre
    FROM sale_details sd
    LEFT JOIN products p ON sd.id_producto = p.id
    WHERE sd.id_venta = ?
  `).all(id);

  return { ...sale, details };
};

/**
 * Obtiene el historial de productos vendidos
 */
const findSalesHistory = () => {
  const statement = db.prepare(`
    SELECT sd.id, s.id as id_factura, p.nombre as producto_nombre, sd.cantidad, sd.precio_momento, sd.tasa_dia, s.fecha
    FROM sale_details sd
    JOIN sales s ON sd.id_venta = s.id
    JOIN products p ON sd.id_producto = p.id
    ORDER BY s.fecha DESC
  `);
  return statement.all();
};

const saleRepository = {
  createSale,
  findSales,
  findTodaySales,
  findSaleById,
  findSalesHistory,
};

export default saleRepository;
