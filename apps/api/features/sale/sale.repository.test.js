import test from 'node:test';
import assert from 'node:assert';
import db from '../../db/index.js';
import saleRepository from './sale.repository.js';

test('saleRepository.findReport validation', async (t) => {
  // Use a transaction that rolls back to avoid polluting the database
  const transaction = db.transaction(() => {
    // 1. Insert a temporary user
    const userInsert = db.prepare(`
      INSERT INTO users (nombre, email, password_hash)
      VALUES (?, ?, ?) RETURNING id
    `).get('Test Reporter', 'reporter@test.com', 'dummy_hash');
    const userId = userInsert.id;

    // Helper to insert a sale
    const insertSale = (invoiceNum, dateStr, totalBs, subtotalUsd, ivaBs, exentoBs) => {
      db.prepare(`
        INSERT INTO sales (numero_factura, fecha, total_bs, subtotal_usd, iva_monto_bs, monto_exento_bs, id_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(invoiceNum, dateStr, totalBs, subtotalUsd, ivaBs, exentoBs, userId);
    };

    // 2. Insert sales across different days/weeks/months
    // Prev week Sunday
    insertSale('FAC-T0001', '2026-05-31 10:00:00', 100.0, 10.0, 0.0, 100.0);
    // Current week Monday
    insertSale('FAC-T0002', '2026-06-01 12:00:00', 232.0, 4.0, 32.0, 0.0);
    // Current week Wednesday (our reference date)
    insertSale('FAC-T0003', '2026-06-03 14:30:00', 116.0, 2.0, 16.0, 0.0);
    // Current week Sunday
    insertSale('FAC-T0004', '2026-06-07 18:00:00', 50.0, 5.0, 0.0, 50.0);
    // Next week Monday
    insertSale('FAC-T0005', '2026-06-08 09:00:00', 116.0, 2.0, 16.0, 0.0);
    // Next month Wednesday
    insertSale('FAC-T0006', '2026-07-01 15:00:00', 200.0, 20.0, 0.0, 200.0);

    // Run tests inside the transaction context
    // Test 1: Daily Report
    const dayReport = saleRepository.findReport(userId, 'day', '2026-06-03');
    assert.strictEqual(dayReport.summary.total_facturas, 1);
    assert.strictEqual(dayReport.summary.total_facturado_bs, 116.0);
    assert.strictEqual(dayReport.summary.total_iva_bs, 16.0);
    assert.strictEqual(dayReport.facturas.length, 1);
    assert.strictEqual(dayReport.facturas[0].numero_factura, 'FAC-T0003');

    // Test 2: Weekly Report (reference date: Wednesday 2026-06-03)
    // The week should be Monday 2026-06-01 to Sunday 2026-06-07.
    // It should include: FAC-T0002 (June 1), FAC-T0003 (June 3), FAC-T0004 (June 7)
    // It should exclude: FAC-T0001 (May 31), FAC-T0005 (June 8)
    const weekReport = saleRepository.findReport(userId, 'week', '2026-06-03');
    assert.strictEqual(weekReport.summary.total_facturas, 3);
    // Total factored: 232 (FAC-T0002) + 116 (FAC-T0003) + 50 (FAC-T0004) = 398.0
    assert.strictEqual(weekReport.summary.total_facturado_bs, 398.0);
    // Total IVA: 32 (FAC-T0002) + 16 (FAC-T0003) = 48.0
    assert.strictEqual(weekReport.summary.total_iva_bs, 48.0);
    assert.strictEqual(weekReport.facturas.length, 3);
    const invoiceNumbers = weekReport.facturas.map(f => f.numero_factura);
    assert.ok(invoiceNumbers.includes('FAC-T0002'));
    assert.ok(invoiceNumbers.includes('FAC-T0003'));
    assert.ok(invoiceNumbers.includes('FAC-T0004'));
    assert.ok(!invoiceNumbers.includes('FAC-T0001'));
    assert.ok(!invoiceNumbers.includes('FAC-T0005'));

    // Test 3: Monthly Report (June 2026)
    // Should include: FAC-T0002, FAC-T0003, FAC-T0004, FAC-T0005
    // Should exclude: FAC-T0001 (May), FAC-T0006 (July)
    const monthReport = saleRepository.findReport(userId, 'month', '2026-06-03');
    assert.strictEqual(monthReport.summary.total_facturas, 4);
    assert.strictEqual(monthReport.facturas.length, 4);
    const monthInvoiceNumbers = monthReport.facturas.map(f => f.numero_factura);
    assert.ok(monthInvoiceNumbers.includes('FAC-T0002'));
    assert.ok(monthInvoiceNumbers.includes('FAC-T0003'));
    assert.ok(monthInvoiceNumbers.includes('FAC-T0004'));
    assert.ok(monthInvoiceNumbers.includes('FAC-T0005'));
    assert.ok(!monthInvoiceNumbers.includes('FAC-T0001'));
    assert.ok(!monthInvoiceNumbers.includes('FAC-T0006'));

    // Force rollback of the transaction to leave db clean
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
