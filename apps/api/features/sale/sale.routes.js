import { Router } from 'express';
import saleRepository from './sale.repository.js';
import { authenticate } from '../auth/auth.middlewares.js';
import { createSaleRouteSchema } from './sale.routes.schemas.js';
import { generateInvoiceHtml } from '../../services/invoice-template.js';
import nodemailerService from '../../services/nodemailer.js';

const saleRouter = Router();

// Todas las rutas de ventas requieren autenticación
saleRouter.use(authenticate);

// Crear una venta
saleRouter.post('/', async (req, res, next) => {
  try {
    const body = createSaleRouteSchema.body.parse(req.body);
    const sale = await saleRepository.createSale({
      subtotal_usd: body.subtotal_usd,
      monto_exento_bs: body.monto_exento_bs,
      iva_porcentaje: body.iva_porcentaje,
      iva_monto_bs: body.iva_monto_bs,
      total_bs: body.total_bs,
      nombre_cliente: body.nombre_cliente,
      cedula_cliente: body.cedula_cliente,
      id_usuario: req.user.id,
      items: body.items,
    });
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
});

// Obtener todas las ventas
saleRouter.get('/', async (req, res, next) => {
  try {
    const sales = await saleRepository.findSales(req.user.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Obtener ventas de hoy (para el dashboard)
saleRouter.get('/today', async (req, res, next) => {
  try {
    const sales = await saleRepository.findTodaySales(req.user.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Obtener historial detallado de items vendidos
saleRouter.get('/history/items', async (req, res, next) => {
  try {
    const history = await saleRepository.findSalesHistory(req.user.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Reporte dinámico (día, semana, mes)
saleRouter.get('/report', async (req, res, next) => {
  try {
    const type = req.query.type || 'month';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const report = await saleRepository.findReport(req.user.id, type, date);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Reporte mensual de IVA
saleRouter.get('/report/monthly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const report = await saleRepository.findMonthlyReport(req.user.id, year, month);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Obtener HTML de la factura para impresión
saleRouter.get('/:id/invoice', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await saleRepository.findSaleById(id, req.user.id);
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    const html = generateInvoiceHtml(sale, sale.businessProfile);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// Enviar factura por correo electrónico
saleRouter.post('/:id/invoice/email', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Correo del destinatario requerido' });

    const sale = await saleRepository.findSaleById(id, req.user.id);
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const html = generateInvoiceHtml(sale, sale.businessProfile);
    const emisorNombre = sale.businessProfile?.razon_social || 'SIGO';

    await nodemailerService.sendMail({
      from: `"${emisorNombre}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📄 Factura ${sale.numero_factura || ''} — ${emisorNombre}`,
      html: html,
    });

    return res.status(200).json({ message: 'Factura enviada exitosamente al correo' });
  } catch (error) {
    next(error);
  }
});

// Obtener una venta por ID con detalles
saleRouter.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await saleRepository.findSaleById(id, req.user.id);
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
});

export default saleRouter;
