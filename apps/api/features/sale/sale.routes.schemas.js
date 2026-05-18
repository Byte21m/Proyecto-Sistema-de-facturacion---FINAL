import { z } from 'zod';

export const createSaleRouteSchema = {
  body: z.object({
    subtotal_usd: z.number().nonnegative('El subtotal USD debe ser no-negativo'),
    monto_exento_bs: z.number().nonnegative().default(0),
    iva_porcentaje: z.number().nonnegative().default(16),
    iva_monto_bs: z.number().nonnegative().default(0),
    total_bs: z.number().positive('El total en Bs debe ser positivo'),
    nombre_cliente: z.string().optional(),
    cedula_cliente: z.string().optional(),
    tasa_dia: z.number().positive('La tasa del día debe ser positiva'),
    items: z.array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
        precio_momento: z.number().positive(),
        tasa_dia: z.number().positive(),
        exento_iva: z.boolean().optional().default(false),
      })
    ).min(1, 'La venta debe tener al menos un producto'),
  }),
};
