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
  const productRows = (details || []).map((item, idx) => {
    const subtotalUsd = item.precio_momento * item.cantidad;
    const subtotalBs = subtotalUsd * item.tasa_dia;
    const exentoLabel = item.exento_iva ? '<span style="color:#059669;font-size:9px;font-weight:700;background:#ecfdf5;padding:2px 8px;border-radius:6px;margin-left:6px;letter-spacing:0.5px;">EXENTO</span>' : '';
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="background:${bgColor};">
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:500;">
          ${item.producto_nombre || 'Producto'}${exentoLabel}
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:center;font-weight:600;">${item.cantidad}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">$${item.precio_momento.toFixed(2)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">Bs ${(item.precio_momento * item.tasa_dia).toFixed(2)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:700;text-align:right;">Bs ${subtotalBs.toFixed(2)}</td>
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #f1f5f9; }
    .invoice-container { max-width: 800px; margin: 24px auto; background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; }

    /* ── Header ── */
    .invoice-header {
      background: linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 100%);
      color: #fff; padding: 36px 40px;
      position: relative; overflow: hidden;
    }
    .invoice-header::before {
      content: ''; position: absolute; top: -40%; right: -10%; width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    .invoice-header::after {
      content: ''; position: absolute; bottom: -30%; left: 20%; width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
      border-radius: 50%;
    }
    .invoice-header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; position: relative; z-index: 1; }
    .invoice-header .factura-badge {
      display: inline-block; background: rgba(255,255,255,0.18); backdrop-filter: blur(4px);
      padding: 5px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;
      margin-top: 8px; letter-spacing: 0.5px; position: relative; z-index: 1;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .invoice-header .right { text-align: right; position: relative; z-index: 1; }
    .invoice-header .right p { font-size: 13px; opacity: 0.85; line-height: 1.8; }
    .invoice-header .right .rif-badge {
      display: inline-block; background: rgba(255,255,255,0.15); padding: 3px 12px;
      border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
      border: 1px solid rgba(255,255,255,0.12);
    }

    /* ── Info Section ── */
    .info-section {
      padding: 28px 40px;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .info-block { flex: 1; }
    .info-block h3 {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
      color: #4f46e5; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
    }
    .info-block h3::before {
      content: ''; display: inline-block; width: 3px; height: 14px;
      background: linear-gradient(180deg, #4f46e5, #7c3aed); border-radius: 2px;
    }
    .info-block p { font-size: 13px; color: #475569; line-height: 1.8; }
    .info-block p strong { color: #1e293b; font-weight: 600; }

    /* ── Products Table ── */
    .table-section { padding: 8px 40px 28px; }
    .table-section table { width: 100%; border-collapse: collapse; margin-top: 8px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .table-section thead th {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;
      color: #fff; padding: 14px 16px; text-align: left;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    }

    /* ── Totals ── */
    .totals-section { padding: 0 40px 36px; }
    .totals-box {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px 28px;
      position: relative; overflow: hidden;
    }
    .totals-box::before {
      content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
      background: linear-gradient(180deg, #4f46e5, #7c3aed); border-radius: 4px 0 0 4px;
    }
    .totals-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13px; }
    .totals-row .label { color: #64748b; font-weight: 500; }
    .totals-row .value { font-weight: 600; color: #1e293b; }
    .totals-row.grand {
      padding: 16px 0 6px; margin-top: 12px;
      border-top: 2px dashed #cbd5e1;
    }
    .totals-row.grand .label { font-size: 16px; font-weight: 800; color: #1e293b; }
    .totals-row.grand .value { font-size: 20px; font-weight: 900; color: #4f46e5; }

    /* ── Footer ── */
    .footer {
      text-align: center; padding: 24px 40px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border-top: 1px solid #e2e8f0;
    }
    .footer p { font-size: 11px; color: #94a3b8; line-height: 1.7; }
    .footer .brand-line {
      display: inline-flex; align-items: center; gap: 6px;
      font-weight: 700; color: #4f46e5; font-size: 11px;
      background: #eef2ff; padding: 4px 14px; border-radius: 20px; margin-top: 8px;
    }

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
    <table class="invoice-header" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 100%); color: #fff; border-radius: 16px 16px 0 0; border-collapse: collapse; width: 100%;">
      <tr>
        <td valign="top" align="left" style="padding: 36px 20px 36px 40px;">
          <h1 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff;">${emisorNombre}</h1>
          <div style="display: inline-block; background: rgba(255,255,255,0.18); padding: 5px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-top: 8px; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.15); color: #ffffff;">📄 ${numero_factura || 'SIN NÚMERO'}</div>
        </td>
        <td valign="top" align="right" style="padding: 42px 40px 36px 20px; text-align: right;">
          ${emisorRif ? `<p style="margin: 0 0 6px 0;"><span style="display: inline-block; background: rgba(255,255,255,0.15); padding: 3px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid rgba(255,255,255,0.12); color: #ffffff;">RIF: ${emisorRif}</span></p>` : ''}
          ${emisorDireccion ? `<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; color: #ffffff; line-height: 1.4;">${emisorDireccion}</p>` : ''}
          ${emisorTelefono ? `<p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.85; color: #ffffff; line-height: 1.4;">📞 ${emisorTelefono}</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- Info Section -->
    <table class="info-section" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); border-bottom: 1px solid #e2e8f0; border-collapse: collapse; width: 100%;">
      <tr>
        <td valign="top" width="50%" style="padding: 28px 40px; border-right: 1px solid #e2e8f0;">
          <h3 style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #4f46e5; margin: 0 0 12px 0; border-left: 3px solid #4f46e5; padding-left: 6px; display: block; line-height: 1.4;">Datos de la Factura</h3>
          <p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0 0 4px 0;"><strong style="color: #1e293b; font-weight: 600;">N° Factura:</strong> ${numero_factura || '—'}</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0 0 4px 0;"><strong style="color: #1e293b; font-weight: 600;">Fecha:</strong> ${fechaStr}</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0 0 4px 0;"><strong style="color: #1e293b; font-weight: 600;">Hora:</strong> ${horaStr}</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0;"><strong style="color: #1e293b; font-weight: 600;">Tasa BCV:</strong> Bs ${tasaDia.toFixed(2)} / $1</p>
        </td>
        <td valign="top" width="50%" style="padding: 28px 40px;">
          <h3 style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #4f46e5; margin: 0 0 12px 0; border-left: 3px solid #4f46e5; padding-left: 6px; display: block; line-height: 1.4;">Datos del Cliente</h3>
          ${nombre_cliente ? `<p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0 0 4px 0;"><strong style="color: #1e293b; font-weight: 600;">Nombre:</strong> ${nombre_cliente}</p>` : '<p style="color:#94a3b8;font-style:italic;margin:0;font-size: 13px;">Cliente de paso</p>'}
          ${cedula_cliente ? `<p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 0;"><strong style="color: #1e293b; font-weight: 600;">C.I. / RIF:</strong> ${cedula_cliente}</p>` : ''}
        </td>
      </tr>
    </table>

    <!-- Products Table -->
    <div class="table-section" style="padding: 8px 40px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; margin-top: 8px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; width: 100%;">
        <thead>
          <tr>
            <th style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 14px 16px; text-align: left; background: #4f46e5;">Descripción</th>
            <th style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 14px 16px; text-align: center; background: #4f46e5; width: 70px;">Cant.</th>
            <th style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 14px 16px; text-align: right; background: #4f46e5; width: 100px;">P. Unit. ($)</th>
            <th style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 14px 16px; text-align: right; background: #4f46e5; width: 110px;">P. Unit. (Bs)</th>
            <th style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fff; padding: 14px 16px; text-align: right; background: #4f46e5; width: 130px;">Subtotal (Bs)</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section" style="padding: 0 40px 36px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-left: 4px solid #4f46e5; border-radius: 14px; padding: 24px 28px; border-collapse: collapse; width: 100%;">
        <tr>
          <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">Base Imponible (gravado)</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b;">$${subtotal_usd.toFixed(2)} — Bs ${baseImponibleBs.toFixed(2)}</td>
        </tr>
        ${monto_exento_bs > 0 ? `
        <tr>
          <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">Monto Exento</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b;">$${exentoUsd.toFixed(2)} — Bs ${monto_exento_bs.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td align="left" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">IVA (${iva_porcentaje}%)</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #1e293b;">$${ivaUsd.toFixed(2)} — Bs ${iva_monto_bs.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 12px 0 6px 0; border-top: 2px dashed #cbd5e1;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%;">
              <tr>
                <td align="left" valign="middle" style="font-size: 16px; font-weight: 800; color: #1e293b; padding: 0;">TOTAL A PAGAR</td>
                <td align="right" valign="middle" style="text-align: right; padding: 0;">
                  <div style="font-size: 16px; font-weight: 700; color: #312e81; margin: 0 0 2px 0; line-height: 1.2;">$${totalUsd.toFixed(2)}</div>
                  <div style="font-size: 20px; font-weight: 900; color: #059669; margin: 0; line-height: 1.2;">Bs ${total_bs.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Factura comercial generada el ${fechaStr} — Tasa BCV: Bs ${tasaDia.toFixed(2)}/$</p>
      <div class="brand-line">⚡ SIGO</div>
      <p style="margin-top:6px;">Gracias por su preferencia 🙌</p>
    </div>
  </div>
</body>
</html>`;
}
