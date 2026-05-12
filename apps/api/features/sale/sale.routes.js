import { Router } from 'express';
import saleRepository from './sale.repository.js';
import { authenticate } from '../auth/auth.middlewares.js';
import { createSaleRouteSchema } from './sale.routes.schemas.js';

const saleRouter = Router();

// Todas las rutas de ventas requieren autenticación
saleRouter.use(authenticate);

// Crear una venta
saleRouter.post('/', async (req, res, next) => {
  try {
    const body = createSaleRouteSchema.body.parse(req.body);
    const sale = saleRepository.createSale({
      total_bs: body.total_bs,
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
    const sales = saleRepository.findSales(req.user.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Obtener ventas de hoy (para el dashboard)
saleRouter.get('/today', async (req, res, next) => {
  try {
    const sales = saleRepository.findTodaySales(req.user.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Obtener historial detallado de items vendidos
saleRouter.get('/history/items', async (req, res, next) => {
  try {
    const history = saleRepository.findSalesHistory(req.user.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Obtener una venta por ID con detalles
saleRouter.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sale = saleRepository.findSaleById(id, req.user.id);
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    res.json(sale);
  } catch (error) {
    next(error);
  }
});

export default saleRouter;
