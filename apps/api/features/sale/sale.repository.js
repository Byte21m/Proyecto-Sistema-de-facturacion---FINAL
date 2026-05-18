import db from '../../db/index.js';

/**
 * Genera el siguiente número de factura para un usuario
 * @param {number} userId
 * @returns {string} Número de factura formateado (FAC-00001)
 */
const getNextInvoiceNumber = (userId) => {
  const result = db.prepare(`
    SELECT numero_factura FROM sales 
    WHERE id_usuario = ? AND numero_factura IS NOT NULL
    ORDER BY id DESC LIMIT 1
  `).get(userId);

  if (!result || !result.numero_factura) return 'FAC-00001';

  const currentNum = parseInt(result.numero_factura.replace('FAC-', ''), 10);
  return `FAC-${String(currentNum + 1).padStart(5, '0')}`;
};

/**
 * Crea una venta con sus detalles en una transacción
 * @param {Object} params
 * @param {number} params.subtotal_usd - Subtotal en dólares (base imponible)
 * @param {number} params.monto_exento_bs - Monto exento en bolívares
 * @param {number} params.iva_porcentaje - Alícuota del IVA (16)
 * @param {number} params.iva_monto_bs - Monto del IVA en bolívares
 * @param {number} params.total_bs - Total en bolívares (incluye IVA)
 * @param {string} [params.nombre_cliente] - Nombre del cliente (opcional)
 * @param {string} [params.cedula_cliente] - Cédula/RIF del cliente (opcional)
 * @param {number} params.id_usuario - ID del usuario que realiza la venta
 * @param {Array} params.items - Detalles de la venta
 * @returns {Object} La venta creada con sus detalles
 */
const createSale = (params) => {
  const { subtotal_usd, monto_exento_bs, iva_porcentaje, iva_monto_bs, total_bs, nombre_cliente, cedula_cliente, id_usuario, items } = params;

  const insertSale = db.prepare(`
    INSERT INTO sales (numero_factura, subtotal_usd, monto_exento_bs, iva_porcentaje, iva_monto_bs, total_bs, nombre_cliente, cedula_cliente, id_usuario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
  `);

  const insertDetail = db.prepare(`
    INSERT INTO sale_details (id_venta, id_producto, tasa_dia, cantidad, precio_momento, exento_iva)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateStock = db.prepare(`
    UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
  `);

  const transaction = db.transaction(() => {
    const numeroFactura = getNextInvoiceNumber(id_usuario);

    // 1. Crear la venta con campos fiscales
    const sale = insertSale.get(
      numeroFactura, subtotal_usd, monto_exento_bs, iva_porcentaje, iva_monto_bs, total_bs,
      nombre_cliente || null, cedula_cliente || null, id_usuario
    );

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
        item.precio_momento,
        item.exento_iva ? 1 : 0
      );

      details.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_momento: item.precio_momento,
        tasa_dia: item.tasa_dia,
        exento_iva: item.exento_iva,
      });
    }

    return { ...sale, details };
  });

  return transaction();
};

/**
 * Obtiene todas las ventas de un usuario
 */
const findSales = (id_usuario) => {
  const statement = db.prepare(`
    SELECT s.*, u.email as usuario_email
    FROM sales s
    LEFT JOIN users u ON s.id_usuario = u.id
    WHERE s.id_usuario = ?
    ORDER BY s.fecha DESC
  `);
  return statement.all(id_usuario);
};

/**
 * Obtiene las ventas de hoy
 */
const findTodaySales = (id_usuario) => {
  const statement = db.prepare(`
    SELECT s.*, u.email as usuario_email,
           (SELECT COALESCE(SUM(sd.precio_momento * sd.cantidad), 0) FROM sale_details sd WHERE sd.id_venta = s.id) as total_usd
    FROM sales s
    LEFT JOIN users u ON s.id_usuario = u.id
    WHERE date(s.fecha) = date('now') AND s.id_usuario = ?
    ORDER BY s.fecha DESC
  `);
  return statement.all(id_usuario);
};

/**
 * Obtiene una venta por ID con sus detalles y datos del perfil comercial
 */
const findSaleById = (id, id_usuario) => {
  const sale = db.prepare(`
    SELECT s.*, u.email as usuario_email
    FROM sales s
    LEFT JOIN users u ON s.id_usuario = u.id
    WHERE s.id = ? AND s.id_usuario = ?
  `).get(id, id_usuario);
  if (!sale) return null;

  const details = db.prepare(`
    SELECT sd.*, p.nombre as producto_nombre
    FROM sale_details sd
    LEFT JOIN products p ON sd.id_producto = p.id
    WHERE sd.id_venta = ?
  `).all(id);

  const businessProfile = db.prepare(`
    SELECT * FROM business_profile WHERE user_id = ?
  `).get(id_usuario);

  return { ...sale, details, businessProfile: businessProfile || null };
};

/**
 * Obtiene el historial de productos vendidos
 */
const findSalesHistory = (id_usuario) => {
  const statement = db.prepare(`
    SELECT sd.id, s.id as id_factura, s.numero_factura, p.nombre as producto_nombre, sd.cantidad, sd.precio_momento, sd.tasa_dia, sd.exento_iva, s.fecha
    FROM sale_details sd
    JOIN sales s ON sd.id_venta = s.id
    JOIN products p ON sd.id_producto = p.id
    WHERE s.id_usuario = ?
    ORDER BY s.fecha DESC
  `);
  return statement.all(id_usuario);
};

/**
 * Obtiene el reporte mensual de IVA
 * @param {number} id_usuario
 * @param {number} year - Año (ej: 2026)
 * @param {number} month - Mes (1-12)
 * @returns {Object} Resumen mensual de IVA
 */
const findMonthlyReport = (id_usuario, year, month) => {
  const monthStr = String(month).padStart(2, '0');

  // Resumen general del mes
  const summary = db.prepare(`
    SELECT 
      COUNT(*) as total_facturas,
      COALESCE(SUM(subtotal_usd), 0) as base_imponible_usd,
      COALESCE(SUM(monto_exento_bs), 0) as total_exento_bs,
      COALESCE(SUM(iva_monto_bs), 0) as total_iva_bs,
      COALESCE(SUM(total_bs), 0) as total_facturado_bs
    FROM sales
    WHERE id_usuario = ?
      AND strftime('%Y', fecha) = ?
      AND strftime('%m', fecha) = ?
  `).get(id_usuario, String(year), monthStr);

  // Lista de facturas del mes
  const facturas = db.prepare(`
    SELECT id, numero_factura, fecha, subtotal_usd, monto_exento_bs, iva_porcentaje, iva_monto_bs, total_bs, nombre_cliente, cedula_cliente
    FROM sales
    WHERE id_usuario = ?
      AND strftime('%Y', fecha) = ?
      AND strftime('%m', fecha) = ?
    ORDER BY fecha ASC
  `).all(id_usuario, String(year), monthStr);

  return { summary, facturas };
};

const saleRepository = {
  createSale,
  findSales,
  findTodaySales,
  findSaleById,
  findSalesHistory,
  findMonthlyReport,
};

export default saleRepository;
