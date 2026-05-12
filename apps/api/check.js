import db from './db/index.js';
const users = db.prepare('SELECT id, email FROM users').all();
console.log("Users:", users);

const products = db.prepare('SELECT id, nombre, user_id FROM products').all();
console.log("Products:", products);
