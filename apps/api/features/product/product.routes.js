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
    const products = await productRepository.findProducts(req.user.id);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Crear producto
productRouter.post('/', async (req, res, next) => {
  try {
    const body = createProductRouteSchema.body.parse(req.body);
    const product = await productRepository.createProduct({ ...body, user_id: req.user.id });
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Ya existe un producto con ese nombre' });
    }
    next(error);
  }
});

// Actualizar producto
productRouter.put('/:id', async (req, res, next) => {
  try {
    const { id } = updateProductRouteSchema.params.parse(req.params);
    const body = updateProductRouteSchema.body.parse(req.body);
    const product = await productRepository.updateProduct(id, req.user.id, body);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Eliminar producto (soft delete)
productRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = deleteProductRouteSchema.params.parse(req.params);
    await productRepository.deleteProduct(id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default productRouter;
