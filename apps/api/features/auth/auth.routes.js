import { Router } from 'express';
import { loginRouteSchema, verifyRouteSchema } from './auth.routes.schemas.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../user/user.repository.js';
import authRepository from './auth.repository.js';
import nodemailerService from '../../services/nodemailer.js';
import { authenticate } from './auth.middlewares.js';
const authRouter = Router();

// Ruta para iniciar sesión
authRouter.post('/login', async (req, res) => {
  // 1. Validamos la data recibida
  const body = loginRouteSchema.body.parse(req.body);

  // 2. Buscar el posible usuario en la base de datos
  const user = await userRepository.findUserByEmail(body.email);

  if (!user || !user?.email_verified) {
    return res.status(403).json({ error: 'Usuario o contraseña invalida' });
  }

  // 3. Comprobar la contraseña
  const isPasswordCorrect = await bcrypt.compare(body.password, user.password_hash);

  if (!isPasswordCorrect) {
    return res.status(403).json({ error: 'Usuario o contraseña invalida' });
  }

  // 4. Crear token para cookies
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30m',
    },
  );

  const refreshTokenId = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
      jwtid: refreshTokenId,
    },
  );

  await authRepository.createSession({ jwtid: refreshTokenId, userId: user.id });

  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  res.cookie('refresh_token', refreshToken, {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });

  return res.status(201).json({ accessToken, userId: user.id, email: user.email });
});

// Ruta para verificar el correo del usuario
authRouter.patch('/verify', async (req, res, next) => {
  // 1. Verificar el body
  const { token } = verifyRouteSchema.body.parse(req.body);

  try {
    // 2. Verificar el token
    const decodedToken = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    // 3. Buscar el usuario asociado al token
    const user = await userRepository.findUserByEmail(decodedToken.email);

    // 4. Verificar si el usuario ya esta verificado
    if (user.email_verified) {
      return res.status(200).json({ message: 'El usuario ya esta verificado.' });
    }

    // 5. Actualizar el usuario a verificado
    await userRepository.updateEmailVerify(decodedToken.id);

    // 6. Responder al cliente
    return res.status(200).json({ message: 'Usuario verificado.' });
  } catch (error) {
    // Si el error es por token expirado, reenviar el correo de verificación
    if (error instanceof jwt.TokenExpiredError) {
      const decodedToken = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET, {
        ignoreExpiration: true,
      });
      const emailToken = jwt.sign(
        {
          id: decodedToken.id,
          email: decodedToken.email,
        },
        process.env.EMAIL_TOKEN_SECRET,
        {
          expiresIn: '1h',
        },
      );

      await nodemailerService.sendMail({
        to: decodedToken.email,
        subject: '⚠️ Enlace Actualizado - Sistema de Facturación',
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
                                <td align="center" style="background-color: #991b1b; padding: 30px 20px;">
                                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 2px;">🛑 ALERTA DE SEGURIDAD</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h1 style="color: #1e293b; font-size: 24px; margin-top: 0; margin-bottom: 20px;">Tu pasaporte ha caducado, pero...</h1>
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                        Estimado(a) Cliente,<br><br>
                                        Notamos que hiciste clic para confirmar tu cuenta pero este enlace era muy antiguo. En la industria de facturación, la ciberseguridad es vital. Nuestros tokens se auto-destruyen cada hora.<br><br>
                                        Afortunadamente, hemos generado <b>una nueva llave blindada</b> y fresquita de validación solo para ti.
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center" style="padding: 10px 0 30px 0;">
                                                <a href="${CLIENT_ENDPOINT}/verify/${emailToken}" style="background-color: #ef4444; border-radius: 6px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 1.5; padding: 15px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    🔑 Verificar mi nueva llave
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f1f5f9; padding: 25px; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                                        Este es un correo automático. Esta nueva llave expirará nuevamente en 60 minutos como medida de protección pasiva.
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
    }

    // Para cualquier otro error, responder con un error genérico
    next(error);
  }
});

// Ruta para solicitar restablecimiento de contraseña
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Correo requerido' });

    const user = await userRepository.findUserByEmail(email);
    // Siempre respondemos éxito para no revelar si el correo existe o no
    if (!user) {
      return res.status(200).json({ message: 'Si el correo existe, hemos enviado un enlace de recuperación.' });
    }

    // Crear token efímero (15 mins)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.EMAIL_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const clientEndpoint = process.env.CLIENT_ENDPOINT || 'http://localhost:4321';

    await nodemailerService.sendMail({
      to: user.email,
      subject: '🔐 Recuperación de Contraseña - SIGO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para asignar una nueva.</p>
          <p><strong>Este enlace expira en 15 minutos.</strong></p>
          <a href="${clientEndpoint}/reset-password?token=${resetToken}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Restablecer Contraseña</a>
          <p style="color: #6b7280; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Si el correo existe, hemos enviado un enlace de recuperación.' });
  } catch (error) {
    next(error);
  }
});

// Ruta para restablecer contraseña
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Faltan datos' });

    // Verificar token
    const decodedToken = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET);
    
    // Encriptar nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Actualizar en base de datos
    await userRepository.updatePassword(decodedToken.id, passwordHash);

    // 6. Cerrar todas las sesiones (Invalidar)
    await authRepository.deleteAllSessionsByUserId(decodedToken.id);

    return res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }
    return res.status(403).json({ error: 'Enlace inválido o corrupto.' });
  }
});

// Ruta para refrescar el token de acceso
authRouter.get('/refresh', async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;

  // 2. Decodificar el refresh token
  const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // 3. Encontrar la session asociada al refresh token
  const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
  if (!session) return res.sendStatus(401);

  // 4. Crear un nuevo token de acceso y refresh token
  const accessToken = jwt.sign(
    { id: decodedToken.id, email: decodedToken.email },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30m',
    },
  );
  const refreshTokenId = crypto.randomUUID();
  const newRefreshToken = jwt.sign(
    { id: decodedToken.id, email: decodedToken.email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
      jwtid: refreshTokenId,
    },
  );

  // 5. Guardar el nuevo refresh token en las cookies y actualizar la session en la base de datos
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  res.cookie('refresh_token', newRefreshToken, {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });
  await authRepository.updateSessionJwtId({ jwtid: refreshTokenId, id: session.id });

  // 6. Responder al cliente con el nuevo token de acceso
  return res.status(200).json({ accessToken, userId: decodedToken.id, email: decodedToken.email });
});

// Ruta para obtener la información del usuario autenticado
authRouter.get('/user', authenticate, async (req, res) => {
  return res.status(200).json(req.user);
});

// Ruta para cerrar sesión
authRouter.post('/signout', authenticate, async (req, res) => {
  // 1. Obtener el refresh token
  const refreshToken = req.cookies?.refresh_token;

  // 2. Decodificar el refresh token
  const decodedToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // 3. Encontrar la session asociada al refresh token
  const session = await authRepository.findSessionByJwtId({ jwtid: decodedToken.jti });
  if (!session) return res.sendStatus(401);

  // 4. Eliminar el token de los cookies
  const expireDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  res.clearCookie('refresh_token', {
    expires: expireDate,
    httpOnly: true,
    secure: process.env.ENV_MODE === 'prod',
    sameSite: 'strict',
  });

  // 5. Eliminar la session de la base de datos
  await authRepository.deleteSession(session.id);

  // 6. Responder al cliente
  return res.sendStatus(204);
});

export default authRouter;
