import { z } from 'zod';

export const createSaleRouteSchema = {
  body: z.object({
    total_bs: z.number().positive('El total en Bs debe ser positivo'),
    tasa_dia: z.number().positive('La tasa del día debe ser positiva'),
    items: z.array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
        precio_momento: z.number().positive(),
        tasa_dia: z.number().positive(),
      })
    ).min(1, 'La venta debe tener al menos un producto'),
  }),
};
