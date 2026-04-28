import { Router } from 'express';
import productRepository from './product.repository.js';
import { authenticate } from '../auth/auth.middlewares.js';
import { 
  createProductRouteSchema, 
  updateProductRouteSchema, 
  deleteProductRouteSchema 
} from './product.routes.schemas.js';

const productRouter = Router();

// Todas las rutas de productos requieren autenticación
productRouter.use(authenticate);

// Listar productos
productRouter.get('/', async (req, res, next) => {
  try {
    const products = await productRepository.findProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Crear producto
productRouter.post('/', async (req, res, next) => {
  try {
    const body = createProductRouteSchema.body.parse(req.body);
    const product = await productRepository.createProduct(body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// Actualizar producto
productRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = updateProductRouteSchema.params.parse(req.params);
    const body = updateProductRouteSchema.body.parse(req.body);
    const product = await productRepository.updateProduct(id, body);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Eliminar producto
productRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = deleteProductRouteSchema.params.parse(req.params);
    await productRepository.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default productRouter;
