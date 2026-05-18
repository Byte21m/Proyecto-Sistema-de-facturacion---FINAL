# 4. Inicio de Sesión, Autenticación y Recuperación (Features / Auth)

La carpeta `apps/api/features/auth/` gestiona el ciclo completo de identidad digital del usuario: verificación de correo, inicio de sesión (Login) con doble token, refresco continuo de sesiones y recuperación segura de contraseñas.

## 1. La Ruta de Verificación (PATCH /verify)
Cuando un usuario hace clic en el enlace enviado a su bandeja de entrada, la solicitud llega a este endpoint:
1. Se extrae el token encriptado enviado por URL.
2. `jwt.verify` desencripta la carga útil utilizando la clave secreta del servidor (`EMAIL_TOKEN_SECRET`).
3. El sistema localiza al usuario y actualiza su estado `email_verified` a `1` mediante `userRepository.updateEmailVerify()`.
**Manejo de Caducidad**: Si el token expiró (pasó más de 1 hora), el bloque `catch (error instanceof jwt.TokenExpiredError)` intercepta la falla, extrae los datos del token caducado, genera uno nuevo y dispara automáticamente un correo electrónico alertando al usuario y proporcionándole un nuevo enlace fresco de validación.

## 2. La Ruta de Login (POST /login)
Es el filtro de entrada al sistema, diseñado para resistir intentos de intrusión:
1. **Validación**: Zod inspecciona que se hayan suministrado correo y contraseña con formato válido.
2. **Supervisión de Estado**: Se consulta SQLite para recuperar al usuario. Si no existe o si su campo `email_verified` es `0`, el acceso es rechazado inmediatamente con un código HTTP 403.
3. **Cotejo de Hashes**: Se ejecuta `bcrypt.compare()` para verificar que la contraseña en texto plano coincida matemáticamente con el hash almacenado.
4. **Emisión de Tokens Duales**: Al autenticar con éxito, el sistema despacha dos pasaportes criptográficos:
   - **Access Token**: Un token JWT ligero con vida útil de 30 minutos, devuelto en el JSON de respuesta para ser enviado en las cabeceras `Authorization: Bearer <token>` de peticiones subsecuentes.
   - **Refresh Token**: Un token de larga duración (7 días) firmado con `REFRESH_TOKEN_SECRET` y asociado a un UUID aleatorio (`jwtid`). Este token se almacena en la tabla de base de datos `sessions` y se envía al navegador dentro de una **Cookie HTTP-Only, Secure y SameSite=Strict**. Este mecanismo blinda la sesión contra robos por JavaScript (XSS) y falsificación de peticiones (CSRF), permitiendo al usuario reabrir la aplicación sin reintroducir su clave diariamente.

## 3. Flujo de Recuperación de Contraseña (Forgot & Reset Password)
Para garantizar la continuidad operativa cuando un usuario olvida sus credenciales, se implementaron dos endpoints corporativos:

### Solicitud de Enlace (`POST /forgot-password`)
1. El cliente envía su dirección de correo electrónico.
2. El backend consulta la base de datos para verificar la existencia de la cuenta. **Protección contra Enumeración de Usuarios**: Para evitar que atacantes descubran qué correos están registrados, el servidor siempre retorna el mismo mensaje de éxito estandarizado ("Si el correo existe, hemos enviado un enlace..."), independientemente de si se encontró o no el registro.
3. Si el usuario existe, se emite un token JWT de vida ultra-corta (**15 minutos**) y se envía un correo HTML mediante Nodemailer con un botón seguro que dirige al formulario de restablecimiento en el frontend.

### Restablecimiento Efectivo (`POST /reset-password`)
1. El usuario introduce su nueva contraseña en el formulario al que accedió mediante el enlace del correo.
2. El servidor recibe el token y la nueva clave. Se verifica la autenticidad y vigencia del token con `jwt.verify`.
3. Se encripta la nueva contraseña mediante `bcrypt.hash(password, 10)` y se actualiza el registro en la tabla `users`.
4. **Invalidación Global de Sesiones**: Como medida crítica de ciberseguridad, se ejecuta `authRepository.deleteAllSessionsByUserId(userId)`. Esto purga instantáneamente de la base de datos todas las sesiones activas en cualquier dispositivo, obligando a re-iniciar sesión con las nuevas credenciales.

## Conclusión
La combinación de encriptación fuerte en base de datos (Bcrypt), validación estricta de esquemas (Zod) y una arquitectura de doble token (JWT + Cookies HTTP-Only) conforma una muralla inexpugnable para la protección de los datos financieros y comerciales del cliente.
