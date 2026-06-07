import { Router } from 'express';
import { authenticate } from '../auth/auth.middlewares.js';
import dashboardRepository from './dashboard.repository.js';

const dashboardRouter = Router();

// Todas las rutas de estadísticas requieren autenticación
dashboardRouter.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Obtiene las métricas de tendencia, distribución fiscal y top de ventas para el dashboard.
 */
dashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const trend = dashboardRepository.getSalesTrend(userId);
    const topProducts = dashboardRepository.getTopProducts(userId);
    const fiscal = dashboardRepository.getFiscalDistribution(userId);

    res.json({
      trend,
      topProducts,
      fiscal
    });
  } catch (error) {
    next(error);
  }
});

export default dashboardRouter;
