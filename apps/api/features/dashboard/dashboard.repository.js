import supabase from '../../db/index.js';

/**
 * Obtiene la tendencia de ventas de los últimos 7 días (incluyendo hoy)
 * @param {number} userId
 * @returns {Promise<Array>} Listado de 7 días con totales de ventas
 */
const getSalesTrend = async (userId) => {
  const now = new Date();
  const days = [];

  // Generar últimos 7 días en hora local (de hace 6 días hasta hoy)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const dateStr = localDate.toISOString().split('T')[0];
    days.push({
      fecha: dateStr,
      total_bs: 0,
      cantidad: 0,
    });
  }

  const { data, error } = await supabase.rpc('get_sales_trend', {
    p_user_id: userId,
    p_start_date: days[0].fecha,
  });

  if (error) throw error;

  // Mezclar resultados
  (data || []).forEach(row => {
    // Asegurarse de que coincida con el formato local YYYY-MM-DD
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
 * @returns {Promise<Array>} Top 5 productos
 */
const getTopProducts = async (userId) => {
  const now = new Date();
  const date30DaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const localDate = new Date(date30DaysAgo.getTime() - date30DaysAgo.getTimezoneOffset() * 60000);
  const date30DaysAgoStr = localDate.toISOString().split('T')[0];

  const { data, error } = await supabase.rpc('get_top_products', {
    p_user_id: userId,
    p_start_date: date30DaysAgoStr,
  });

  if (error) throw error;
  return data || [];
};

/**
 * Obtiene la distribución fiscal (base gravada, exento e IVA) del mes actual
 * @param {number} userId
 * @returns {Promise<Object>} Datos fiscales
 */
const getFiscalDistribution = async (userId) => {
  const now = new Date();
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');

  const { data, error } = await supabase.rpc('get_fiscal_distribution', {
    p_user_id: userId,
    p_year: yearStr,
    p_month: monthStr,
  });

  if (error) throw error;

  const row = data && data[0] ? data[0] : { total_exento_bs: 0, total_iva_bs: 0, total_facturado_bs: 0, total_facturas: 0 };

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
    total_facturas,
  };
};

const dashboardRepository = {
  getSalesTrend,
  getTopProducts,
  getFiscalDistribution,
};

export default dashboardRepository;
