# 2. Base de Datos (SQLite)

La base de datos relacional es el núcleo transaccional del sistema, donde almacenamos de forma persistente e íntegra los usuarios, sesiones, catálogo de productos y registros de ventas. Está gestionada mediante la librería de alto rendimiento `better-sqlite3` sobre el archivo `apps/api/database.db`.

## Archivo `index.js` (La Conexión)
Establece la conexión directa con el archivo SQLite y activa de inmediato el modo de registro por adelantado **WAL** (`pragma journal_mode = WAL`). Este modo optimiza el acceso concurrente, permitiendo que múltiples lecturas y escrituras ocurran simultáneamente a velocidades extraordinarias sin bloquear la base de datos.

## Archivo `tables.js` (Estructura de las Tablas)
Contiene las sentencias de definición de datos (DDL) en SQL puro para generar la estructura del sistema. Para reiniciar o inicializar la base de datos desde cero en cualquier entorno, basta con ejecutar `node apps/api/db/tables.js`.

El esquema de la base de datos se fundamenta en las siguientes 5 tablas principales:

```sql
-- 1. Tabla de Usuarios y Comercios
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT 0
);
```
* **id**: Identificador único autoincremental.
* **email**: Correo electrónico del comercio. Posee una restricción `UNIQUE` para evitar registros duplicados.
* **password_hash**: Almacena el hash seguro generado mediante `bcrypt`. Nunca se guardan contraseñas en texto plano.
* **email_verified**: Indicador de seguridad (0 o 1). Bloquea el acceso hasta que el cliente valida su cuenta mediante el token enviado a su correo.

```sql
-- 2. Tabla de Sesiones (Persistencia y Seguridad)
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jwtid TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```
* **jwtid**: Código identificador UUID único para cada sesión válida.
* **user_id**: Llave foránea que relaciona la sesión con el dueño de la cuenta, permitiendo invalidar todas las sesiones simultáneamente al cambiar contraseñas o revocar accesos.

```sql
-- 3. Tabla de Productos (Inventario Multi-usuario)
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio_dolar REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(nombre, user_id)
);
```
* **nombre**: Nombre descriptivo del artículo.
* **precio_dolar**: Precio unitario fijado en moneda estable (USD).
* **stock**: Cantidad de existencias físicas disponibles para la venta.
* **user_id**: Llave foránea obligatoria. Garantiza el aislamiento multi-usuario, asegurando que cada comercio vea exclusivamente su propio inventario. La restricción compuesta `UNIQUE(nombre, user_id)` previene la duplicación de ítems idénticos para un mismo cliente.

```sql
-- 4. Tabla Encabezado de Ventas (Facturas)
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_bs REAL NOT NULL,
  id_usuario INTEGER NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES users(id)
);
```
* **id**: Número de factura autoincremental.
* **fecha**: Marca de tiempo exacta generada automáticamente al momento de la compra.
* **total_bs**: Monto total pagado en Bolívares según la tasa del día.
* **id_usuario**: Usuario o cajero responsable de la transacción.

```sql
-- 5. Tabla Detalles de Venta (Ítems Facturados)
CREATE TABLE sale_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_venta INTEGER NOT NULL,
  id_producto INTEGER NOT NULL,
  tasa_dia REAL NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_momento REAL NOT NULL,
  FOREIGN KEY (id_venta) REFERENCES sales(id),
  FOREIGN KEY (id_producto) REFERENCES products(id)
);
```
* **id_venta / id_producto**: Relación directa entre la factura y cada producto adquirido.
* **tasa_dia / precio_momento**: Almacenan una fotografía financiera inmutable de la tasa de cambio oficial (BCV) y el precio unitario en dólares al segundo exacto de la compra, garantizando auditorías históricas perfectas ante futuras fluctuaciones económicas.
* **cantidad**: Unidades vendidas en esa línea.

## Integridad Transaccional (Transacciones ACID)
En las operaciones críticas, como el Punto de Venta (POS), SQLite hace uso de transacciones atómicas mediante `db.transaction()`. Al registrar una venta, el repositorio inserta el encabezado en `sales`, descuenta de manera concurrente el stock en `products` e inserta cada línea en `sale_details`. Si el stock de un ítem es insuficiente o surge cualquier error durante el proceso, la transacción ejecuta un **rollback** automático, deshaciendo todos los cambios y garantizando que la base de datos nunca quede en un estado inconsistente o corrupto.
