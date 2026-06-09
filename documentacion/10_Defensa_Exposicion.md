# 10. Guía de Defensa y Exposición del Proyecto

Este documento proporciona los guiones estructurados, puntos clave y consejos estratégicos para defender con éxito el **Sistema de Facturación y Punto de Venta (POS) Bimonetario** ante un jurado, profesor o cliente.

---

## ⏱️ Versión 1: Defensa Express (5 Minutos)
*Ideal para presentaciones rápidas, ejecutivas o evaluaciones cortas.*

### 📋 Estructura de Tiempo Recomendada:
- **Minuto 0:00 - 1:00 (Introducción y Problema):** Presentación, problema que resuelve y visión general.
- **Minuto 1:00 - 2:30 (Arquitectura y Seguridad):** Por qué es robusto (Multi-tenant, JWT Dual, SQLite WAL).
- **Minuto 2:30 - 4:00 (Demostración del POS y BCV):** Cómo funciona la venta y la reactividad.
- **Minuto 4:00 - 5:00 (Conclusión y Valor de Negocio):** Por qué este proyecto tiene valor real de mercado.

---

### 🎤 Guión Paso a Paso:

#### 1. Introducción y Problema (0:00 - 1:00)
> *"Buenos días. Hoy les presento **FacturaApp**, un sistema de facturación y punto de venta diseñado para resolver la compleja realidad comercial bimonetaria de hoy en día. En muchos comercios pequeños y medianos, la gestión del inventario y las ventas se hace difícil por la fluctuación del Bolívar respecto al Dólar, la falta de control del IVA y la dificultad para facturar rápido. FacturaApp resuelve esto ofreciendo una plataforma rápida, segura y adaptada a la tasa oficial del Banco Central de Venezuela."*

#### 2. Arquitectura y Seguridad (1:00 - 2:30)
> *"Tecnológicamente, el sistema utiliza una arquitectura Monorepo moderna: un backend REST en **Express.js** y un frontend de alto rendimiento en **Astro 6** con **Tailwind CSS v4**.*
>
> *Destaco tres pilares de nuestra arquitectura:*
> 1. ***Multi-Tenant (Aislamiento de Datos):** El sistema es multi-usuario. Cada comercio se registra y tiene sus datos (productos, ventas) completamente aislados mediante filtros estrictos de `user_id` a nivel de base de datos SQL.*
> 2. ***Seguridad Bancaria:** Usamos autenticación basada en doble token JWT. El token de acceso es corto, y el de refresco se guarda en una cookie segura HTTP-Only, impidiendo robos de sesión por ataques XSS o CSRF. Además, el flujo de recuperación de contraseña invalida todas las sesiones activas por seguridad.*
> 3. ***Rendimiento Transaccional:** Usamos SQLite en modo WAL (Write-Ahead Logging), lo que nos da velocidad de lectura y escritura inmediata sin caídas."*

#### 3. Módulo POS y Demostración (2:30 - 4:00)
> *"En la pantalla del Punto de Venta (POS), el cliente consume automáticamente en tiempo real la tasa de cambio oficial del BCV a través de una API externa. El carrito de compras calcula al instante el subtotal, el IVA del 16% y el total en Bolívares y Dólares en paralelo.*
> 
> *A nivel de base de datos, el registro de la venta es atómico (ACID): se ejecuta en una sola transacción SQL. Si agregamos una venta, se crea la factura, se descuenta el inventario y se inserta el detalle del precio. Si el stock no es suficiente, la base de datos hace un rollback (marcha atrás) completo para evitar datos corruptos."*

#### 4. Conclusión (4:00 - 5:00)
> *"En resumen, FacturaApp no es solo un sistema contable, es una herramienta lista para la nube que ayuda a los comerciantes a proteger su inventario, automatizar sus cálculos contables de IVA y agilizar las ventas del día a día. Muchas gracias. Quedo abierto a sus preguntas."*

---

## ⏱️ Versión 2: Defensa Detallada (10 Minutos)
*Ideal para exposiciones formales, tesis de grado o demostraciones completas a clientes.*

### 📋 Estructura de Tiempo Recomendada:
- **Minuto 0:00 - 2:00 (Contexto y Tecnologías):** Introducción al negocio y stack tecnológico.
- **Minuto 2:00 - 4:30 (Backend y Base de Datos Transaccional):** Explicación técnica de la BD y la API.
- **Minuto 4:30 - 6:30 (Seguridad y Flujos de Autenticación):** Tokens, Cookies y flujo de recuperación.
- **Minuto 6:30 - 8:30 (Frontend Reactivo e Integración BCV):** Astro, NanoStores, DolarAPI y UI.
- **Minuto 8:30 - 10:00 (Conclusiones y Preguntas):** Resumen de ingeniería y cierre.

---

### 🎤 Guión Paso a Paso:

#### 1. Introducción y Stack Tecnológico (0:00 - 2:00)
> *"Buenos días a todos. Hoy les presento la defensa de nuestro **Sistema de Facturación y POS Bimonetario**. Este proyecto nace de una necesidad real del mercado venezolano: la urgencia de contar con un software que facilite las ventas bimonetarias (USD/Bs) de manera rápida, segura y bajo las normativas fiscales básicas.*
>
> *Para lograr esto, diseñamos una arquitectura fullstack desacoplada:*
> - *En el **Backend**, implementamos una API REST robusta en **Node.js** con **Express.js**, utilizando **better-sqlite3** como motor relacional optimizado.*
> - *En el **Frontend**, elegimos **Astro 6** por su arquitectura de islas de alto rendimiento, reduciendo a casi cero el JavaScript innecesario en el navegador, y estilizamos con la última versión de **Tailwind CSS v4** para una interfaz moderna, limpia y adaptada a modo oscuro y claro."*

#### 2. Base de Datos y Transaccionalidad ACID (2:00 - 4:30)
> *"Pasemos a la capa de datos. Uno de los mayores desafíos en un punto de venta son las concurrencias: ¿qué pasa si dos cajeros venden el último producto al mismo tiempo?*
>
> *Para evitar inconsistencias, implementamos **Transacciones ACID** directas a nivel de motor. Al registrar una venta, empaquetamos las instrucciones en un bloque `db.transaction()`:*
> 1. *Buscamos el último correlativo para generar el número de factura fiscal (ej: `FAC-00002`).*
> 2. *Insertamos el registro de la venta en la tabla `sales`.*
> 3. *Descontamos el stock de cada producto en la tabla `products` añadiendo una condición estricta: `WHERE stock >= cantidad`. Si el stock resultante fuera menor a cero, la consulta falla.*
> 4. *Insertamos las líneas de venta en `sale_details`.*
>
> *Si alguna de estas operaciones falla por falta de stock o error de red, la transacción ejecuta un **rollback** completo. Los datos nunca quedan a medias.*
> *Además, aplicamos el patrón **Multi-Tenant**: todas las tablas filtran obligatoriamente por el identificador del usuario autenticado, garantizando que ninguna empresa pueda consultar o alterar el inventario de otra."*

#### 3. Ciberseguridad y Autenticación (4:30 - 6:30)
> *"La seguridad es vital en un software financiero. No nos limitamos a un login básico con JWT ordinario. Implementamos un sistema de **Doble Token Criptográfico (Access y Refresh Tokens)**:*
> - *El **Access Token** es un JWT efímero con 30 minutos de vida que se envía en las cabeceras de autorización.*
> - *El **Refresh Token** tiene una validez de 7 días y se almacena en la tabla de sesiones. Este se despacha al navegador en una cookie **HTTP-Only, Secure y SameSite=Strict**. Al ser HTTP-Only, ningún script malicioso de JavaScript en el navegador (ataques XSS) puede leer o robar el token de sesión.*
>
> *Adicionalmente, diseñamos un flujo de recuperación de contraseña seguro a través de `/forgot-password`. El sistema emite un token de restablecimiento de 15 minutos que se envía por correo electrónico usando **Nodemailer**. Al procesarse con éxito el cambio de contraseña, el servidor purga e invalida inmediatamente todas las sesiones anteriores en la base de datos, garantizando que cualquier sesión abierta en otro dispositivo se cierre al instante."*

#### 4. Frontend Reactivo e Integración BCV (6:30 - 8:30)
> *"El frontend destaca por su velocidad y reactividad. En lugar de usar frameworks pesados como React para todo el sitio, usamos Astro 6.*
>
> *Para manejar el estado global de forma ultraligera, incorporamos **NanoStores**. El catálogo de productos se almacena en memoria en un almacén atómico (`inventoryStore`). Cuando el usuario registra un nuevo producto en el POS mediante el modal rápido, la lista del inventario y las sugerencias del buscador se actualizan instantáneamente sin recargar la página.*
>
> *Asimismo, el sistema cuenta con integración no bloqueante con **DolarAPI**. Al cargar la interfaz, consulta silenciosamente en segundo plano la cotización oficial del BCV. El usuario ve reflejados los precios en dólares y bolívares en paralelo, y el carrito realiza las conversiones automáticamente al vuelo. También cuenta con un módulo de **Reportes** completo que desglosa el IVA cobrado, las exenciones y la base imponible por día, semana y mes, listo para imprimir."*

#### 5. Conclusión (8:30 - 10:00)
> *"En conclusión, este proyecto demuestra cómo se puede construir una aplicación comercial robusta y de nivel profesional con tecnologías modernas de código abierto. Es segura contra ataques web comunes, es rápida en transacciones financieras gracias al modo WAL y transacciones ACID, y resuelve un problema real para los comerciantes locales.*
> 
> *A partir de aquí, el sistema está listo para dar el salto a producción en entornos cloud usando bases de datos Postgres en Supabase y servicios de hosting como Render. Muchas gracias por su tiempo. Quedo a su disposición para cualquier duda o comentario técnico."*

---

## 🎯 Preguntas Difíciles del Jurado (y cómo responderlas)

#### ❓ 1. ¿Por qué usaron SQLite en lugar de una base de datos más grande como PostgreSQL?
* **Respuesta:** *"Usamos SQLite en modo WAL (Write-Ahead Logging) porque para implementaciones locales en computadoras de comercios pequeños es ideal: no requiere instalar un motor pesado de base de datos, tiene un rendimiento de lectura increíblemente rápido y las transacciones ACID garantizan la integridad de los datos. Sin embargo, diseñamos la arquitectura pensando en la escalabilidad: la lógica de negocios está aislada en repositorios, lo que permite cambiar el adaptador de la base de datos a PostgreSQL (por ejemplo, para producción en Supabase) con un esfuerzo mínimo sin tocar las rutas ni el frontend."*

#### ❓ 2. ¿Qué pasa si dos cajeros venden el mismo producto sin stock al mismo tiempo?
* **Respuesta:** *"Gracias a las transacciones de base de datos (`db.transaction`), la base de datos procesa las peticiones de forma secuencial y atómica. El primer cajero que complete la transacción restará el stock con la condición `stock >= cantidad`. Cuando el segundo cajero intente hacer lo mismo, la condición no se cumplirá, la consulta devolverá `changes = 0`, lo que disparará un error en nuestro código que cancelará la segunda venta y devolverá un rollback inmediato, manteniendo el stock en cero e informando al segundo cajero que ya no hay disponibilidad."*

#### ❓ 3. ¿Cómo protegen la aplicación contra inyecciones SQL?
* **Respuesta:** *"No concatenamos variables en las cadenas de texto SQL. En su lugar, utilizamos **consultas preparadas (Prepared Statements)** mediante el método `db.prepare(sql).run(params)` (o consultas parametrizadas). Esto asegura que el motor de la base de datos trate los datos proporcionados por el usuario estrictamente como parámetros y nunca como código ejecutable, eliminando por completo el riesgo de inyecciones SQL."*
