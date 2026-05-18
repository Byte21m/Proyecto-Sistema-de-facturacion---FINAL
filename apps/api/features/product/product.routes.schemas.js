import { z } from 'zod';

export const createProductRouteSchema = {
  body: z.object({
    nombre: z.string().min(2),
    precio_dolar: z.number().positive(),
    stock: z.number().int().nonnegative(),
    exento_iva: z.boolean().optional().default(false),
  }),
};

export const updateProductRouteSchema = {
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    nombre: z.string().min(2),
    precio_dolar: z.number().positive(),
    stock: z.number().int().nonnegative(),
    exento_iva: z.boolean().optional().default(false),
  }),
};

export const deleteProductRouteSchema = {
  params: z.object({
    id: z.string().transform(Number),
  }),
};
