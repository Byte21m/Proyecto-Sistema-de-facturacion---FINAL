/**
 * Genera el HTML completo de una factura comercial profesional
 * @param {Object} saleData - Datos de la venta con detalles
 * @param {Object|null} businessProfile - Perfil comercial del emisor
 * @returns {string} HTML autocontenido con CSS inline listo para impresión
 */
export function generateInvoiceHtml(saleData, businessProfile) {
  const {
    numero_factura, fecha, subtotal_usd, monto_exento_bs, iva_porcentaje,
    iva_monto_bs, total_bs, nombre_cliente, cedula_cliente, details
  } = saleData;

  const fechaObj = new Date(fecha);
  const fechaStr = fechaObj.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr = fechaObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

  // Calcular tasa del día desde el primer detalle
  const tasaDia = details?.[0]?.tasa_dia || 1;

  // Calcular totales en USD
  const ivaUsd = tasaDia > 0 ? iva_monto_bs / tasaDia : 0;
  const exentoUsd = tasaDia > 0 ? monto_exento_bs / tasaDia : 0;
  const totalUsd = tasaDia > 0 ? total_bs / tasaDia : 0;

  // Calcular base imponible en Bs
  const baseImponibleBs = subtotal_usd * tasaDia;

  // Generar filas de la tabla de productos
  const productRows = (details || []).map(item => {
    const subtotalUsd = item.precio_momento * item.cantidad;
    const subtotalBs = subtotalUsd * item.tasa_dia;
    const exentoLabel = item.exento_iva ? '<span style="color:#059669;font-size:10px;font-weight:700;background:#ecfdf5;padding:1px 6px;border-radius:4px;margin-left:4px;">EXENTO</span>' : '';

    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">
          ${item.producto_nombre || 'Producto'}${exentoLabel}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;">${item.cantidad}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">$${item.precio_momento.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">Bs ${(item.precio_momento * item.tasa_dia).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:700;text-align:right;">Bs ${subtotalBs.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Datos del emisor
  const emisorNombre = businessProfile?.razon_social || 'Mi Comercio';
  const emisorRif = businessProfile?.rif || '';
  const emisorDireccion = businessProfile?.direccion || '';
  const emisorTelefono = businessProfile?.telefono || '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${numero_factura || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #f8fafc; }
    .invoice-container { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .invoice-header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
    .invoice-header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .invoice-header .factura-num { font-size: 16px; font-weight: 700; opacity: 0.9; margin-top: 4px; }
    .invoice-header .right { text-align: right; }
    .invoice-header .right p { font-size: 13px; opacity: 0.85; line-height: 1.6; }
    .info-section { display: flex; justify-content: space-between; padding: 24px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; gap: 24px; }
    .info-block { flex: 1; }
    .info-block h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 8px; }
    .info-block p { font-size: 13px; color: #475569; line-height: 1.7; }
    .info-block p strong { color: #1e293b; }
    .table-section { padding: 0 32px 24px; }
    .table-section table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table-section thead th { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    .totals-section { padding: 0 32px 32px; }
    .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals-row .label { color: #64748b; }
    .totals-row .value { font-weight: 600; color: #1e293b; }
    .totals-row.grand { padding: 12px 0 4px; margin-top: 8px; border-top: 2px solid #e2e8f0; }
    .totals-row.grand .label { font-size: 16px; font-weight: 800; color: #1e293b; }
    .totals-row.grand .value { font-size: 18px; font-weight: 900; color: #4f46e5; }
    .footer { text-align: center; padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .no-print { display: block; }
    @media print {
      body { background: #fff; }
      .invoice-container { box-shadow: none; margin: 0; border-radius: 0; }
      .no-print { display: none !important; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div>
        <h1>${emisorNombre}</h1>
        <p class="factura-num">${numero_factura || 'SIN NÚMERO'}</p>
      </div>
      <div class="right">
        ${emisorRif ? `<p><strong>RIF:</strong> ${emisorRif}</p>` : ''}
        ${emisorDireccion ? `<p>${emisorDireccion}</p>` : ''}
        ${emisorTelefono ? `<p>Tel: ${emisorTelefono}</p>` : ''}
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-block">
        <h3>Datos de la Factura</h3>
        <p><strong>N° Factura:</strong> ${numero_factura || '—'}</p>
        <p><strong>Fecha:</strong> ${fechaStr}</p>
        <p><strong>Hora:</strong> ${horaStr}</p>
        <p><strong>Tasa BCV:</strong> Bs ${tasaDia.toFixed(2)} / $1</p>
      </div>
      <div class="info-block">
        <h3>Datos del Cliente</h3>
        ${nombre_cliente ? `<p><strong>Nombre:</strong> ${nombre_cliente}</p>` : '<p style="color:#94a3b8;">Cliente de paso</p>'}
        ${cedula_cliente ? `<p><strong>C.I. / RIF:</strong> ${cedula_cliente}</p>` : ''}
      </div>
    </div>

    <!-- Products Table -->
    <div class="table-section">
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th style="text-align:center;">Cant.</th>
            <th style="text-align:right;">P. Unit. ($)</th>
            <th style="text-align:right;">P. Unit. (Bs)</th>
            <th style="text-align:right;">Subtotal (Bs)</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Base Imponible (gravado)</span>
          <span class="value">$${subtotal_usd.toFixed(2)} — Bs ${baseImponibleBs.toFixed(2)}</span>
        </div>
        ${monto_exento_bs > 0 ? `
        <div class="totals-row">
          <span class="label">Monto Exento</span>
          <span class="value">$${exentoUsd.toFixed(2)} — Bs ${monto_exento_bs.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="totals-row">
          <span class="label">IVA (${iva_porcentaje}%)</span>
          <span class="value">$${ivaUsd.toFixed(2)} — Bs ${iva_monto_bs.toFixed(2)}</span>
        </div>
        <div class="totals-row grand">
          <span class="label">TOTAL A PAGAR</span>
          <span class="value">$${totalUsd.toFixed(2)} — Bs ${total_bs.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Factura comercial generada por FacturaApp — ${fechaStr} — Tasa BCV: Bs ${tasaDia.toFixed(2)}/$</p>
      <p style="margin-top:4px;">Gracias por su preferencia 🙌</p>
    </div>
  </div>
</body>
</html>`;
}
