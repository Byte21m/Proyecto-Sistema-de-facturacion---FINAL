import { Router } from 'express';
import { z } from 'zod';
import businessRepository from './business.repository.js';
import { authenticate } from '../auth/auth.middlewares.js';

const businessRouter = Router();

// Todas las rutas requieren autenticación
businessRouter.use(authenticate);

// Esquema de validación del perfil comercial
const businessProfileSchema = z.object({
  razon_social: z.string().min(2, 'La razón social debe tener al menos 2 caracteres'),
  rif: z.string().min(5, 'El RIF debe tener al menos 5 caracteres'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
});

// Obtener perfil comercial
businessRouter.get('/', async (req, res, next) => {
  try {
    const profile = businessRepository.findProfileByUserId(req.user.id);
    res.json(profile || null);
  } catch (error) {
    next(error);
  }
});

// Crear o actualizar perfil comercial
businessRouter.put('/', async (req, res, next) => {
  try {
    const body = businessProfileSchema.parse(req.body);
    const profile = businessRepository.createOrUpdateProfile(req.user.id, body);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export default businessRouter;
