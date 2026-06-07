import test from 'node:test';
import assert from 'node:assert';
import db from '../../db/index.js';
import dashboardRepository from './dashboard.repository.js';

test('dashboardRepository validation', async (t) => {
  const transaction = db.transaction(() => {
    // 1. Insertar usuario temporal
    const userInsert = db.prepare(`
      INSERT INTO users (nombre, email, password_hash)
      VALUES (?, ?, ?) RETURNING id
    `).get('Test Dashboarder', 'dashboarder@test.com', 'dummy_hash');
    const userId = userInsert.id;

    // 2. Insertar productos temporales
    const insertProduct = (nombre, price, stock) => {
      return db.prepare(`
        INSERT INTO products (nombre, precio_dolar, stock, user_id)
        VALUES (?, ?, ?, ?) RETURNING id
      `).get(nombre, price, stock, userId).id;
    };
    const prodId1 = insertProduct('Star Product', 10.0, 100);
    const prodId2 = insertProduct('Normal Product', 5.0, 50);

    // 3. Helper para insertar facturas con detalles
    const insertSaleWithDetails = (dateStr, totalBs, subtotalUsd, ivaBs, exentoBs, items) => {
      const sale = db.prepare(`
        INSERT INTO sales (numero_factura, fecha, total_bs, subtotal_usd, iva_monto_bs, monto_exento_bs, id_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
      `).get('FAC-' + Math.random().toString().slice(2, 7), dateStr, totalBs, subtotalUsd, ivaBs, exentoBs, userId);

      items.forEach(item => {
        db.prepare(`
          INSERT INTO sale_details (id_venta, id_producto, producto_nombre, tasa_dia, cantidad, precio_momento, exento_iva)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(sale.id, item.id, item.nombre, item.tasa, item.cantidad, item.precio, item.exento ? 1 : 0);
      });
    };

    // 4. Crear ventas de prueba con marcas de tiempo relativas (horas locales)
    const today = new Date();
    const formatDate = (offsetDays) => {
      const d = new Date(today.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 19).replace('T', ' ');
    };

    // Venta Hoy: Star product (3 unidades), Normal product (1 unidad)
    insertSaleWithDetails(formatDate(0), 150.0, 15.0, 16.0, 50.0, [
      { id: prodId1, nombre: 'Star Product', tasa: 10.0, cantidad: 3, precio: 10.0, exento: false },
      { id: prodId2, nombre: 'Normal Product', tasa: 10.0, cantidad: 1, precio: 5.0, exento: true }
    ]);

    // Venta hace 1 día: Star product (5 unidades)
    insertSaleWithDetails(formatDate(1), 500.0, 50.0, 0.0, 500.0, [
      { id: prodId1, nombre: 'Star Product', tasa: 10.0, cantidad: 5, precio: 10.0, exento: true }
    ]);

    // Test 1: Tendencia de Ventas (últimos 7 días)
    const trend = dashboardRepository.getSalesTrend(userId);
    assert.strictEqual(trend.length, 7);
    assert.strictEqual(trend[6].total_bs, 150.0);
    assert.strictEqual(trend[6].cantidad, 1);
    assert.strictEqual(trend[5].total_bs, 500.0);
    assert.strictEqual(trend[5].cantidad, 1);
    assert.strictEqual(trend[0].total_bs, 0); // hace 6 días

    // Test 2: Productos Estrella (Top 5)
    const top = dashboardRepository.getTopProducts(userId);
    assert.strictEqual(top.length, 2);
    assert.strictEqual(top[0].nombre, 'Star Product');
    assert.strictEqual(parseInt(top[0].total_vendido), 8);
    assert.strictEqual(top[1].nombre, 'Normal Product');
    assert.strictEqual(parseInt(top[1].total_vendido), 1);

    // Test 3: Distribución Fiscal
    const fiscal = dashboardRepository.getFiscalDistribution(userId);
    assert.strictEqual(fiscal.total_exento_bs, 550.0);
    assert.strictEqual(fiscal.total_iva_bs, 16.0);
    assert.strictEqual(fiscal.base_gravada_bs, 84.0);
    assert.strictEqual(fiscal.total_facturado_bs, 650.0);
    assert.strictEqual(fiscal.total_facturas, 2);

    throw new Error('ROLLBACK_INTENDED');
  });

  try {
    transaction();
  } catch (err) {
    if (err.message !== 'ROLLBACK_INTENDED') {
      throw err;
    }
  }
});
