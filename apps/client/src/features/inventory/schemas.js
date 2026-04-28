import * as z from 'zod';

export const productSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  precio_dolar: z.number().positive({
    message: 'El precio debe ser un número positivo.',
  }),
  stock: z.number().int().nonnegative({
    message: 'El stock no puede ser negativo.',
  }),
});

/** @typedef {z.infer<typeof productSchema>} Product */

export const createProductSchema = productSchema.pick({ nombre: true, precio_dolar: true, stock: true });
export const updateProductSchema = productSchema.pick({ nombre: true, precio_dolar: true, stock: true });
