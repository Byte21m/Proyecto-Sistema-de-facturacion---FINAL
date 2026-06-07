import db from '../../db/index.js';

/**
 * Obtiene la tendencia de ventas de los últimos 7 días (incluyendo hoy)
 * @param {number} userId
 * @returns {Array} Listado de 7 días con totales de ventas
 */
const getSalesTrend = (userId) => {
  const now = new Date();
  const days = [];

  // Generar últimos 7 días en hora local (de hace 6 días hasta hoy)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Ajustar a zona horaria local para obtener la fecha correcta YYYY-MM-DD
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const dateStr = localDate.toISOString().split('T')[0];
    days.push({
      fecha: dateStr,
      total_bs: 0,
      cantidad: 0
    });
  }

  const queryResult = db.prepare(`
    SELECT date(fecha) as dia, SUM(total_bs) as total_bs, COUNT(*) as cantidad
    FROM sales
    WHERE id_usuario = ? AND date(fecha) >= ?
    GROUP BY date(fecha)
  `).all(userId, days[0].fecha);

  // Mezclar resultados
  queryResult.forEach(row => {
    const day = days.find(d => d.fecha === row.dia);
    if (day) {
      day.total_bs = parseFloat(row.total_bs) || 0;
      day.cantidad = parseInt(row.cantidad) || 0;
    }
  });

  return days;
};

/**
 * Obtiene los 5 productos más vendidos de los últimos 30 días
 * @param {number} userId
 * @returns {Array} Top 5 productos
 */
const getTopProducts = (userId) => {
  const now = new Date();
  const date30DaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const localDate = new Date(date30DaysAgo.getTime() - date30DaysAgo.getTimezoneOffset() * 60000);
  const date30DaysAgoStr = localDate.toISOString().split('T')[0];

  return db.prepare(`
    SELECT 
      sd.producto_nombre as nombre,
      SUM(sd.cantidad) as total_vendido,
      COALESCE(SUM(sd.precio_momento * sd.cantidad), 0) as total_usd,
      COALESCE(SUM(sd.precio_momento * sd.cantidad * sd.tasa_dia), 0) as total_bs
    FROM sale_details sd
    JOIN sales s ON sd.id_venta = s.id
    WHERE s.id_usuario = ? AND date(s.fecha) >= ?
    GROUP BY sd.id_producto, sd.producto_nombre
    ORDER BY total_vendido DESC
    LIMIT 5
  `).all(userId, date30DaysAgoStr);
};

/**
 * Obtiene la distribución fiscal (base gravada, exento e IVA) del mes actual
 * @param {number} userId
 * @returns {Object} Datos fiscales
 */
const getFiscalDistribution = (userId) => {
  const now = new Date();
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');

  const row = db.prepare(`
    SELECT 
      COALESCE(SUM(monto_exento_bs), 0) as total_exento_bs,
      COALESCE(SUM(iva_monto_bs), 0) as total_iva_bs,
      COALESCE(SUM(total_bs), 0) as total_facturado_bs,
      COUNT(*) as total_facturas
    FROM sales
    WHERE id_usuario = ? 
      AND strftime('%Y', fecha) = ? 
      AND strftime('%m', fecha) = ?
  `).get(userId, yearStr, monthStr);

  const total_exento_bs = parseFloat(row.total_exento_bs) || 0;
  const total_iva_bs = parseFloat(row.total_iva_bs) || 0;
  const total_facturado_bs = parseFloat(row.total_facturado_bs) || 0;
  const total_facturas = parseInt(row.total_facturas) || 0;
  
  // Base Imponible Gravada es: Total - IVA - Exento
  const base_gravada_bs = Math.max(0, total_facturado_bs - total_iva_bs - total_exento_bs);

  return {
    total_exento_bs,
    total_iva_bs,
    base_gravada_bs,
    total_facturado_bs,
    total_facturas
  };
};

const dashboardRepository = {
  getSalesTrend,
  getTopProducts,
  getFiscalDistribution
};

export default dashboardRepository;
