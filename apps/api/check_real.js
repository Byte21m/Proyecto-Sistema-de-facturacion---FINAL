import db from './db/index.js';
try {
  console.log("SALES:", db.prepare('SELECT * FROM sales').all());
} catch(e) {
  console.log("ERROR:", e.message);
}
