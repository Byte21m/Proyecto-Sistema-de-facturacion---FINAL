const db = require('better-sqlite3')('database.db');

// 1. Remove the (eliminado x) suffix from the products
db.prepare("UPDATE products SET nombre = SUBSTR(nombre, 1, INSTR(nombre, ' (eliminado') - 1) WHERE nombre LIKE '% (eliminado %'").run();

// 2. Add producto_nombre to sale_details
try {
  db.prepare('ALTER TABLE sale_details ADD COLUMN producto_nombre TEXT').run();
} catch (e) {
  if (!e.message.includes('duplicate column name')) {
    throw e;
  }
}

// 3. Backfill producto_nombre from products
db.prepare('UPDATE sale_details SET producto_nombre = (SELECT nombre FROM products WHERE products.id = sale_details.id_producto)').run();

// 4. Set producto_nombre as NOT NULL? Not necessary, but let's make sure it's populated.
console.log('Migration complete');
