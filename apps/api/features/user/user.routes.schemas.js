import * as z from 'zod';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const createUserRouteSchema = {
  body: z.object({
    nombre: z.string()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, { message: 'El nombre solo debe contener letras y espacios' }),
    email: z.string().email({ message: 'Tiene que ser un email válido' }),
    password: z.string().regex(PASSWORD_REGEX, {
      message: 'Recuerda cumplir los requerimientos de la contraseña',
    }),
    razon_social: z.string().min(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' }),
    rif: z.string().regex(/^\d{9}$/, { message: 'El RIF debe tener exactamente 9 números' }).optional().or(z.literal('')),
  }),
  params: null,
  query: null,
};
