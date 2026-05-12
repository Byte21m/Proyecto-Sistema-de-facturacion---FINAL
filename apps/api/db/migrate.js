import db from './index.js';

try {
  console.log('Iniciando migración correcta...');
  
  db.pragma('foreign_keys = OFF');
  
  const transaction = db.transaction(() => {
    // 1. Crear la nueva tabla
    db.prepare(`
      CREATE TABLE IF NOT EXISTS products_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio_dolar REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        user_id INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(nombre, user_id)
      )
    `).run();
    
    // 2. Migrar los datos desde products_old (si falló el drop antes) o de products
    // Revisar si existe products_old
    const oldExists = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='products_old'").get().c > 0;
    const sourceTable = oldExists ? 'products_old' : 'products';
    
    db.prepare(`
      INSERT INTO products_new (id, nombre, precio_dolar, stock)
      SELECT id, nombre, precio_dolar, stock FROM ${sourceTable}
    `).run();
    
    // 3. Eliminar la tabla original/vieja
    if (oldExists) db.prepare('DROP TABLE products_old').run();
    db.prepare('DROP TABLE IF EXISTS products').run();
    
    // 4. Renombrar la nueva
    db.prepare('ALTER TABLE products_new RENAME TO products').run();
  });
  
  transaction();
  
  db.pragma('foreign_keys = ON');
  console.log('Migración completada exitosamente sin problemas de foreign key!');
} catch (error) {
  console.error('Error durante la migración:', error);
}
