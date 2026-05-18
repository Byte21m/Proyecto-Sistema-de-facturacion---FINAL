# 1. Introducción al Backend del Sistema de Facturación

Esta documentación está diseñada para que puedas estudiar y entender paso a paso cómo está construido el backend (la parte lógica que no se ve) y el frontend visual de tu aplicación de facturación, basándonos exactamente en la arquitectura profesional de tu profesor y las expansiones premium implementadas.

## ¿Qué es esto?
Este proyecto es un sistema integral de facturación y punto de venta (POS) con soporte multi-usuario. El backend funciona como una **API REST** robusta: recibe las solicitudes de la interfaz visual (Astro + Tailwind), procesa la lógica de negocio, se conecta de forma segura a la base de datos y retorna respuestas estructuradas en JSON.

Las herramientas y tecnologías principales que conforman el núcleo del sistema son:
* **Node.js**: Nuestro entorno de ejecución de alto rendimiento en el servidor.
* **Express.js**: Framework minimalista y veloz para crear enrutadores, gestionar peticiones HTTP (GET, POST, PATCH, DELETE) y administrar middlewares.
* **SQLite (better-sqlite3)**: Nuestra base de datos relacional ultrarrápida. Al operar en modo WAL (Write-Ahead Logging) directamente en un archivo local (`database.db`), permite consultas concurrentes de alta velocidad sin la complejidad de servidores externos.
* **Zod**: Nuestro validador estricto de esquemas de datos. Inspecciona cada petición entrante para garantizar que correos, contraseñas y datos numéricos cumplan con las reglas de negocio antes de tocar la base de datos.
* **Nodemailer**: El motor de mensajería. Se conecta mediante SMTP (Gmail) para despachar correos electrónicos corporativos automatizados (verificación de cuentas y recuperación de contraseñas).
* **JWT (JSON Web Tokens)**: El estándar de seguridad digital. Genera pasaportes criptográficos inmutables para el control de acceso, refresco permanente de sesiones y verificación de enlaces efímeros.
* **DolarAPI (BCV)**: Integración en tiempo real para obtener y actualizar la tasa oficial del Banco Central de Venezuela, permitiendo una facturación bimonetaria precisa en Dólares y Bolívares.

## ¿Cómo funciona el archivo principal (`index.js`)?
El archivo `index.js` en el servidor es el punto de entrada donde inicializamos Express y orquestamos toda la configuración:
1. **Middlewares Globales**: Habilitamos `cors` para permitir la comunicación cruzada con el cliente en el puerto 4321, `express.json()` para parsear los cuerpos de las solicitudes y `cookieParser()` para la lectura segura de cookies HTTP-only.
2. **Enrutamiento Modular (Rutas)**: Asignamos sub-enrutadores limpios para cada dominio de características:
   - `/api/user`: Registro de nuevos comercios y usuarios.
   - `/api/auth`: Inicio de sesión, verificación, refresco de tokens y recuperación de claves.
   - `/api/product`: Control de inventario, stock y precios.
   - `/api/sale`: Registro transaccional del Punto de Venta (POS) e historial de facturas.
3. **Manejo Centralizado de Errores**: Un middleware final captura cualquier excepción no manejada (como errores de validación de Zod o violaciones de restricciones en SQLite) y devuelve respuestas amigables con el código de estado HTTP adecuado (400, 401, 403 o 500), protegiendo la estabilidad del servidor en todo momento.
