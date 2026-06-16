import supabase from '../../db/index.js';

/**
 * Genera el siguiente número de factura para un usuario en Supabase
 * @param {number} userId
 * @returns {Promise<string>} Número de factura formateado (FAC-00001)
 */
const getNextInvoiceNumber = async (userId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('numero_factura')
    .eq('id_usuario', userId)
    .not('numero_factura', 'is', null)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.numero_factura) return 'FAC-00001';

  const currentNum = parseInt(data.numero_factura.replace('FAC-', ''), 10);
  return `FAC-${String(currentNum + 1).padStart(5, '0')}`;
};

/**
 * Crea una venta con sus detalles en Supabase
 * @param {Object} params
 * @returns {Promise<Object>} La venta creada con sus detalles
 */
const createSale = async (params) => {
  const { subtotal_usd, monto_exento_bs, iva_porcentaje, iva_monto_bs, total_bs, nombre_cliente, cedula_cliente, id_usuario, items } = params;

  const numeroFactura = await getNextInvoiceNumber(id_usuario);
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();

  // 1. Crear la venta
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      numero_factura: numeroFactura,
      fecha: localISO,
      subtotal_usd,
      monto_exento_bs,
      iva_porcentaje,
      iva_monto_bs,
      total_bs,
      nombre_cliente: nombre_cliente || null,
      cedula_cliente: cedula_cliente || null,
      id_usuario
    })
    .select()
    .single();

  if (saleError) throw saleError;

  const details = [];
  // 2. Insertar cada detalle y actualizar stock
  for (const item of items) {
    // A. Obtener stock actual
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('stock, nombre')
      .eq('id', item.id_producto)
      .single();

    if (prodErr || !product) {
      throw new Error(`Producto no encontrado con ID ${item.id_producto}`);
    }

    if (product.stock < item.cantidad) {
      throw new Error(`Stock insuficiente para el producto "${product.nombre}"`);
    }

    // B. Decrementar stock
    const { error: stockErr } = await supabase
      .from('products')
      .update({ stock: product.stock - item.cantidad })
      .eq('id', item.id_producto);

    if (stockErr) throw stockErr;

    // C. Insertar detalle
    const { error: detailErr } = await supabase
      .from('sale_details')
      .insert({
        id_venta: sale.id,
        id_producto: item.id_producto,
        producto_nombre: item.nombre,
        tasa_dia: item.tasa_dia,
        cantidad: item.cantidad,
        precio_momento: item.precio_momento,
        exento_iva: !!item.exento_iva
      });

    if (detailErr) throw detailErr;

    details.push({
      id_producto: item.id_producto,
      producto_nombre: item.nombre,
      cantidad: item.cantidad,
      precio_momento: item.precio_momento,
      tasa_dia: item.tasa_dia,
      exento_iva: item.exento_iva,
    });
  }

  return { ...sale, details };
};

/**
 * Obtiene todas las ventas de un usuario
 * @param {number} id_usuario
 * @returns {Promise<Array>}
 */
const findSales = async (id_usuario) => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      users:id_usuario (
        email,
        business_profile (
          razon_social
        )
      )
    `)
    .eq('id_usuario', id_usuario)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(s => ({
    ...s,
    usuario_email: s.users?.email || null,
    razon_social: s.users?.business_profile?.razon_social || null,
  }));
};

/**
 * Obtiene las ventas de hoy
 * @param {number} id_usuario
 * @returns {Promise<Array>}
 */
const findTodaySales = async (id_usuario) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      users:id_usuario (
        email,
        business_profile (
          razon_social
        )
      ),
      sale_details (
        precio_momento,
        cantidad
      )
    `)
    .eq('id_usuario', id_usuario)
    .gte('fecha', `${todayStr}T00:00:00`)
    .lte('fecha', `${todayStr}T23:59:59`)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(s => {
    const total_usd = (s.sale_details || []).reduce((acc, curr) => acc + (curr.precio_momento * curr.cantidad), 0);
    return {
      ...s,
      usuario_email: s.users?.email || null,
      razon_social: s.users?.business_profile?.razon_social || null,
      total_usd,
    };
  });
};

/**
 * Obtiene una venta por ID con sus detalles y datos del perfil comercial
 * @param {number} id
 * @param {number} id_usuario
 * @returns {Promise<Object|null>}
 */
const findSaleById = async (id, id_usuario) => {
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .select(`
      *,
      users:id_usuario (
        email
      )
    `)
    .eq('id', id)
    .eq('id_usuario', id_usuario)
    .maybeSingle();

  if (saleErr || !sale) return null;

  const { data: details, error: detailsErr } = await supabase
    .from('sale_details')
    .select('*')
    .eq('id_venta', id);

  if (detailsErr) throw detailsErr;

  const { data: businessProfile, error: bpErr } = await supabase
    .from('business_profile')
    .select('*')
    .eq('user_id', id_usuario)
    .maybeSingle();

  if (bpErr) throw bpErr;

  return {
    ...sale,
    usuario_email: sale.users?.email || null,
    details: details || [],
    businessProfile: businessProfile || null,
  };
};

/**
 * Obtiene el historial de productos vendidos
 * @param {number} id_usuario
 * @returns {Promise<Array>}
 */
const findSalesHistory = async (id_usuario) => {
  const { data, error } = await supabase
    .from('sale_details')
    .select(`
      id,
      producto_nombre,
      cantidad,
      precio_momento,
      tasa_dia,
      exento_iva,
      sales!inner (
        id,
        numero_factura,
        fecha,
        id_usuario
      )
    `)
    .eq('sales.id_usuario', id_usuario)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(sd => ({
    id: sd.id,
    id_factura: sd.sales?.id,
    numero_factura: sd.sales?.numero_factura,
    producto_nombre: sd.producto_nombre,
    cantidad: sd.cantidad,
    precio_momento: sd.precio_momento,
    tasa_dia: sd.tasa_dia,
    exento_iva: sd.exento_iva,
    fecha: sd.sales?.fecha,
  }));
};

/**
 * Obtiene el reporte mensual de IVA
 * @param {number} id_usuario
 * @param {number} year
 * @param {number} month
 * @returns {Promise<Object>}
 */
const findMonthlyReport = async (id_usuario, year, month) => {
  const monthStr = String(month).padStart(2, '0');
  const startOfMonth = `${year}-${monthStr}-01T00:00:00`;
  
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const endOfMonth = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`;

  const { data: facturas, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id_usuario', id_usuario)
    .gte('fecha', startOfMonth)
    .lt('fecha', endOfMonth)
    .order('numero_factura', { ascending: false });

  if (error) throw error;

  const total_facturas = facturas.length;
  const base_imponible_usd = facturas.reduce((acc, f) => acc + (f.subtotal_usd || 0), 0);
  const total_exento_bs = facturas.reduce((acc, f) => acc + (f.monto_exento_bs || 0), 0);
  const total_iva_bs = facturas.reduce((acc, f) => acc + (f.iva_monto_bs || 0), 0);
  const total_facturado_bs = facturas.reduce((acc, f) => acc + (f.total_bs || 0), 0);

  const summary = {
    total_facturas,
    base_imponible_usd,
    total_exento_bs,
    total_iva_bs,
    total_facturado_bs,
  };

  return { summary, facturas };
};

/**
 * Obtiene un reporte unificado por día, semana o mes
 * @param {number} id_usuario
 * @param {string} type - 'day' | 'week' | 'month'
 * @param {string} dateStr
 * @returns {Promise<Object>}
 */
const findReport = async (id_usuario, type, dateStr) => {
  let start = '';
  let end = '';

  if (type === 'day') {
    start = `${dateStr}T00:00:00`;
    end = `${dateStr}T23:59:59`;
  } else if (type === 'week') {
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const chosen = new Date(yr, mo - 1, dy);
    const day = chosen.getDay();
    const diffToMonday = chosen.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(chosen.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDateString = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    start = `${formatDateString(monday)}T00:00:00`;
    end = `${formatDateString(sunday)}T23:59:59`;
  } else {
    const [year, month] = dateStr.split('-');
    const monthVal = Number(month);
    const yearVal = Number(year);
    const monthStr = String(monthVal).padStart(2, '0');
    start = `${yearVal}-${monthStr}-01T00:00:00`;

    const nextMonth = monthVal === 12 ? 1 : monthVal + 1;
    const nextMonthYear = monthVal === 12 ? yearVal + 1 : yearVal;
    end = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`;
  }

  const { data: facturas, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id_usuario', id_usuario)
    .gte('fecha', start)
    .lte('fecha', end)
    .order('numero_factura', { ascending: false });

  if (error) throw error;

  const total_facturas = facturas.length;
  const base_imponible_usd = facturas.reduce((acc, f) => acc + (f.subtotal_usd || 0), 0);
  const total_exento_bs = facturas.reduce((acc, f) => acc + (f.monto_exento_bs || 0), 0);
  const total_iva_bs = facturas.reduce((acc, f) => acc + (f.iva_monto_bs || 0), 0);
  const total_facturado_bs = facturas.reduce((acc, f) => acc + (f.total_bs || 0), 0);

  const summary = {
    total_facturas,
    base_imponible_usd,
    total_exento_bs,
    total_iva_bs,
    total_facturado_bs,
  };

  return { summary, facturas };
};

const saleRepository = {
  createSale,
  findSales,
  findTodaySales,
  findSaleById,
  findSalesHistory,
  findMonthlyReport,
  findReport,
};

export default saleRepository;
