# 3. Registro y Envío de Correos (Features / User)

El módulo de usuarios (`apps/api/features/user`) agrupa de forma auto-contenida toda la lógica, validación y persistencia que rige la creación de nuevas cuentas en el sistema.

## 1. El Esquema de Validación (user.routes.schemas.js)
El primer anillo de seguridad está definido mediante la librería `Zod`. Antes de iniciar cualquier procesamiento, Zod inspecciona el cuerpo de la petición entrante:
- Verifica que el campo de correo electrónico tenga un formato válido de email corporativo o personal.
- Somete la contraseña a una estricta Expresión Regular (`Regex`) que exige un mínimo de 8 caracteres, combinando letras mayúsculas, minúsculas y números.
Si la petición no supera estas validaciones, Zod aborta el flujo instantáneamente devolviendo un error 400 Bad Request, protegiendo al servidor de datos malformados y evitando consultas inútiles a la base de datos.

## 2. El Repositorio (user.repository.js)
El repositorio actúa como una capa de abstracción exclusiva para interactuar con SQLite. Desacopla completamente las consultas SQL de los controladores de ruta. Aquí residen funciones dedicadas como:
- `createUser`: Ejecuta una sentencia `INSERT INTO users (email, password_hash)` retornando el nuevo registro de forma atómica.
- `findUserByEmail`: Realiza una búsqueda veloz indexada `SELECT * FROM users WHERE email = ?` para verificar preexistencias.

## 3. El Flujo de Registro (user.routes.js)
Cuando el cliente envía el formulario de registro desde el frontend a la ruta \`POST /api/user\`, se desencadena una orquestación precisa:
1. **Inspección Zod**: Se analiza y sanitiza el objeto de datos.
2. **Criptografía**: Se invoca `bcrypt.hash(password, 10)` para transformar la contraseña en un hash unidireccional altamente seguro.
3. **Persistencia Inicial**: El repositorio almacena el usuario en SQLite con su bandera `email_verified` en estado inactivo (`0`).
4. **Firma de Token (JWT)**: Se genera un JSON Web Token secreto con un tiempo de caducidad estricto de 1 hora. Este token encripta en su interior el `id` y el `email` del usuario.
5. **Despacho Nodemailer**: Se invoca el servicio `nodemailerService.sendMail(...)` para conectar con los servidores SMTP de Google mediante una contraseña de aplicación segura. Se envía un correo electrónico con plantilla HTML profesional que incluye un botón de confirmación enlazado a la ruta de verificación.
6. **Manejo de Transacciones y Errores**: Si ocurre cualquier fallo durante el envío del correo o si la base de datos detecta un correo duplicado, el sistema maneja la excepción con total pulcritud, eliminando registros inconclusos si es necesario y notificando al cliente.
