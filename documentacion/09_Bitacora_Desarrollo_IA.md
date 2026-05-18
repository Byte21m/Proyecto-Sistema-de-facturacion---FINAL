# 9. Bitácora de Desarrollo y Resumen Arquitectónico (IA)

> **Documento de Referencia Permanente:** Este archivo resume las implementaciones, mejoras y patrones de arquitectura desarrollados en conjunto entre el usuario y la Inteligencia Artificial (Antigravity) para llevar el Sistema de Facturación a su versión de grado profesional.

---

## 1. Resumen de Implementaciones Premium Realizadas

A lo largo de las sesiones de pair-programming, transformamos la base inicial del curso en una plataforma de gestión comercial completa y altamente robusta:

### 🛡️ Autenticación y Seguridad Avanzada
- **Doble Token Criptográfico (Access & Refresh Tokens)**: Implementación de un ciclo de vida de sesión profesional donde los tokens de acceso expiran a los 30 minutos y los tokens de refresco (7 días) se protegen mediante **Cookies HTTP-Only**, blindando al usuario contra ataques XSS y CSRF.
- **Recuperación Blindada de Contraseñas (`/forgot-password` & `/reset-password`)**: Creación de un flujo corporativo que evita la enumeración de usuarios, envía enlaces efímeros de 15 minutos mediante Nodemailer y purga automáticamente todas las sesiones previas del usuario en la base de datos para invalidar accesos comprometidos.

### 🏢 Arquitectura Multi-Usuario (Multi-Tenancy)
- Transición completa del esquema de base de datos a un modelo de aislamiento estricto. Cada tabla del sistema (`products`, `sales`, `sessions`) asocia obligatoriamente sus registros a un `user_id` o `id_usuario`. Todas las consultas del repositorio aplican este filtro para asegurar que cada comercio opere en su propio entorno privado.

### 📦 Gestión Reactiva de Inventario y Catálogo
- Integración de **NanoStores** en el frontend web (`Astro`). El almacén reactivo `inventoryStore` mantiene el catálogo de productos en memoria, permitiendo búsquedas instantáneas, creación de ítems e incrementos de stock sin recargar la página.

### 💰 Punto de Venta Bimonetario (POS) e Integración BCV
- Creación de la interfaz `sales.astro` diseñada para la realidad económica bimonetaria (USD y Bolívares).
- **Conexión Automatizada BCV**: Consulta asíncrona en segundo plano a la API de DolarAPI (`ve.dolarapi.com`) para obtener y mantener actualizada la tasa de cambio oficial del Banco Central de Venezuela, con botón de recarga manual.
- **Cálculos Simultáneos al Vuelo**: El carrito de compras totaliza en tiempo real en ambas monedas.
- **Modal de Registro Rápido (Quick Add)**: Permite añadir un producto nuevo al inventario y cargarlo en el carrito en un solo flujo continuo.

### ⚖️ Transaccionalidad Atómica (ACID)
- Implementación de transacciones de base de datos (`db.transaction`) en SQLite. Al registrar una venta, el servidor inserta el encabezado, descuenta el stock concurrente verificando existencias (`stock >= cantidad`) e inserta el detalle de venta con el precio y la tasa de cambio fijados inmutablemente en ese segundo exacto. Si el stock es insuficiente, se ejecuta un rollback automático que deshace toda la operación.

### 📊 Dashboard e Historial Interactivo
- **Dashboard Estadístico**: Indicadores clave de desempeño calculados al instante (ventas de la jornada, ingresos bimonetarios y tabla de alertas tempranas para stock bajo o agotado ≤ 5 unidades).
- **Historial Interactivo (`history.astro`)**: Registro auditable de todas las facturas emitidas, con filtrado por fecha y un panel lateral deslizable que muestra el desglose exacto de los artículos adquiridos en cada transacción.

---

## 2. Decálogo Arquitectónico para Futuras Expansiones

Para mantener la excelencia y estabilidad de este sistema en el futuro, recuerda siempre estos 5 mandamientos de desarrollo:

1. **Aislamiento Estricto de Datos**: Toda nueva tabla transaccional o de catálogo debe incluir una llave foránea al `user_id`. Nunca realices un `SELECT`, `UPDATE` o `DELETE` sin incluir la cláusula `WHERE user_id = req.user.id`.
2. **Validación Perimetral**: No confíes únicamente en las validaciones de formulario del frontend. Todo nuevo endpoint en Express debe contar con su esquema estricto en Zod.
3. **Atomicidad en Escrituras Múltiples**: Si una acción requiere escribir en más de una tabla (ej. crear cliente y asignarle una factura), utiliza siempre `db.transaction()`.
4. **Estado Atómico en Memoria**: Para nuevas pantallas interactivas en Astro, utiliza NanoStores (`nanostores`) en lugar de almacenar estado disperso en el DOM.
5. **Inmutabilidad Financiera**: En las tablas de detalles transaccionales (`sale_details`), guarda siempre el precio unitario y la cotización de la moneda al momento del hecho. Nunca enlaces el histórico a precios dinámicos del catálogo.
