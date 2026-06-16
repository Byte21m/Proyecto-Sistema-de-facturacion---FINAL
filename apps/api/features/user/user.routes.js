import { Router } from 'express';
import { createUserRouteSchema } from './user.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from './user.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { CLIENT_ENDPOINT } from '../../config.js';
import { authenticate } from '../auth/auth.middlewares.js';

const userRouter = Router();

userRouter.post('/', async (req, res, next) => {
  let createdUser = null;
  try {
    // 1. Validar el requerimiento
    const body = createUserRouteSchema.body.parse(req.body);

    // 2. Encriptar la contraseña
    const passwordHash = await bcrypt.hash(body.password, 10);

    // 3. Guardar en la base datos
    createdUser = await userRepository.createUser({
      nombre: body.nombre,
      email: body.email,
      passwordHash,
      razon_social: body.razon_social,
      rif: body.rif || '',
    });

    // 4. Enviar el correo de validación
    const emailToken = jwt.sign(
      { id: createdUser.id, email: createdUser.email },
      process.env.EMAIL_TOKEN_SECRET,
    );

    await nodemailerService.sendMail({
      to: createdUser.email,
      subject: '🚀 ¡Activa tu Sistema de Facturación PRO!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f6f9fc; width: 100%;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; width: 100%; max-width: 600px;">
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 30px 20px;">
                                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px;"> SYS-FACTURACIÓN PRO</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h1 style="color: #1e293b; font-size: 24px; margin-top: 0; margin-bottom: 20px;">¡Comienza a Facturar Hoy!</h1>
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                        Bienvenido,<br><br>
                                        Tu cuenta corporativa casi está lista. Para brindarte nuestra protección máxima, necesitamos confirmar que esta es tu dirección de correo electrónico real antes de darte de alta en nuestro ecosistema.
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center" style="padding: 10px 0 30px 0;">
                                                <a href="${CLIENT_ENDPOINT}/verify/${emailToken}" style="background-color: #3b82f6; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 1.5; padding: 15px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    ✓ Autorizar mi cuenta
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 0;">
                                        ¿El botón parece no funcionar? Copia y pega el siguiente enlace directo en tu navegador web de preferencia:<br><br>
                                        <a href="${CLIENT_ENDPOINT}/verify/${emailToken}" style="color: #3b82f6; word-break: break-all;">${CLIENT_ENDPOINT}/verify/${emailToken}</a>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f1f5f9; padding: 25px; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                                        Este es un correo automático. Si no solicitaste tu registro a nuestro sistema, puedes ignorar este mensaje tranquilamente. Por razones de seguridad corporativa, este token expirará automáticamente en 60 minutos.
                                        <br><br>
                                        © ${new Date().getFullYear()} Sistema de Facturación. Todos los derechos reservados.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    });

    // 5. Responder con el usuario creado
    res.status(201).json(createdUser);
  } catch (error) {
    // Si el usuario fue creado pero hubo un error en el proceso, eliminar el usuario creado para evitar inconsistencias
    if (createdUser) await userRepository.deleteUserById(createdUser.id);

    // Responder con un error genérico
    next(error);
  }
});

export default userRouter;
