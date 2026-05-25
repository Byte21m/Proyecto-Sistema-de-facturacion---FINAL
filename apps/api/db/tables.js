import db from './index.js';

const createUsersTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT 0
    )
  `);
  statement.run();
  console.log('Tabla de usuarios (users) creada!');
};

const createBusinessProfileTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE business_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      razon_social TEXT NOT NULL,
      rif TEXT,
      direccion TEXT,
      telefono TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  statement.run();
  console.log('Tabla de perfil comercial (business_profile) creada!');
};

const createProductsTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio_dolar REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      exento_iva BOOLEAN DEFAULT 0,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(nombre, user_id)
    )
  `);
  statement.run();
  console.log('Tabla de productos (products) creada!');
};

const createSalesTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_factura TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal_usd REAL DEFAULT 0,
      monto_exento_bs REAL DEFAULT 0,
      iva_porcentaje REAL DEFAULT 16,
      iva_monto_bs REAL DEFAULT 0,
      total_bs REAL NOT NULL,
      nombre_cliente TEXT,
      cedula_cliente TEXT,
      id_usuario INTEGER NOT NULL,
      FOREIGN KEY (id_usuario) REFERENCES users(id),
      UNIQUE(numero_factura, id_usuario)
    )
  `);
  statement.run();
  console.log('Tabla de ventas (sales) creada!');
};

const createSaleDetailsTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE sale_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venta INTEGER NOT NULL,
      id_producto INTEGER NOT NULL,
      tasa_dia REAL NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_momento REAL NOT NULL,
      exento_iva BOOLEAN DEFAULT 0,
      FOREIGN KEY (id_venta) REFERENCES sales(id),
      FOREIGN KEY (id_producto) REFERENCES products(id)
    )
  `);
  statement.run();
  console.log('Tabla de detalles de venta (sale_details) creada!');
};

// La tabla de sesiones es idéntica a la que usó tu profesor para la seguridad
const createSessionTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jwtid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  statement.run();
  console.log('Tabla de sesiones (sessions) creada!');
};

const resetDb = async () => {
  db.prepare('DROP TABLE IF EXISTS sale_details').run();
  db.prepare('DROP TABLE IF EXISTS sales').run();
  db.prepare('DROP TABLE IF EXISTS sessions').run();
  db.prepare('DROP TABLE IF EXISTS products').run();
  db.prepare('DROP TABLE IF EXISTS business_profile').run();
  db.prepare('DROP TABLE IF EXISTS users').run();
  console.log('Tablas eliminadas (reinicio).');
};

export const createTables = async () => {
  await resetDb();
  await createUsersTable();
  await createBusinessProfileTable();
  await createProductsTable();
  await createSalesTable();
  await createSaleDetailsTable();
  await createSessionTable();
  console.log('¡Base de Datos lista y configurada exitosamente!');
};

createTables();
