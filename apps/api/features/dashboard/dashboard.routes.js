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
    
    const [trend, topProducts, fiscal] = await Promise.all([
      dashboardRepository.getSalesTrend(userId),
      dashboardRepository.getTopProducts(userId),
      dashboardRepository.getFiscalDistribution(userId)
    ]);

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
