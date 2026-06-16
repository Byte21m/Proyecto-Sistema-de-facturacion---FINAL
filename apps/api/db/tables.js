/**
 * ═══════════════════════════════════════════════════════════
 * REFERENCIA — SQL para crear tablas en Supabase (PostgreSQL)
 * ═══════════════════════════════════════════════════════════
 * 
 * Este archivo ya NO se ejecuta desde la aplicación en Node.js.
 * Las tablas y funciones deben crearse en el SQL Editor de Supabase.
 * 
 * Copiar y pegar el siguiente SQL en:
 * https://supabase.com/dashboard → Tu Proyecto → SQL Editor → New Query
 * Luego haz clic en "Run".
 * 
 * ─────────────────────────────────────────────────────────
 * 
 * -- 1. Tabla de usuarios
 * CREATE TABLE IF NOT EXISTS users (
 *   id SERIAL PRIMARY KEY,
 *   nombre TEXT,
 *   email TEXT UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   email_verified BOOLEAN DEFAULT false
 * );
 * 
 * -- 2. Tabla de perfil comercial de la PYME
 * CREATE TABLE IF NOT EXISTS business_profile (
 *   id SERIAL PRIMARY KEY,
 *   user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 *   razon_social TEXT NOT NULL,
 *   rif TEXT,
 *   direccion TEXT,
 *   telefono TEXT
 * );
 * 
 * -- 3. Tabla de productos
 * CREATE TABLE IF NOT EXISTS products (
 *   id SERIAL PRIMARY KEY,
 *   nombre TEXT NOT NULL,
 *   precio_dolar NUMERIC(10, 2) NOT NULL,
 *   stock INTEGER DEFAULT 0,
 *   exento_iva BOOLEAN DEFAULT false,
 *   is_deleted BOOLEAN DEFAULT false,
 *   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   UNIQUE(nombre, user_id)
 * );
 * 
 * -- 4. Tabla de ventas / facturas
 * CREATE TABLE IF NOT EXISTS sales (
 *   id SERIAL PRIMARY KEY,
 *   numero_factura TEXT,
 *   fecha TIMESTAMPTZ DEFAULT NOW(),
 *   subtotal_usd NUMERIC(10, 2) DEFAULT 0,
 *   monto_exento_bs NUMERIC(12, 2) DEFAULT 0,
 *   iva_porcentaje NUMERIC(5, 2) DEFAULT 16,
 *   iva_monto_bs NUMERIC(12, 2) DEFAULT 0,
 *   total_bs NUMERIC(12, 2) NOT NULL,
 *   nombre_cliente TEXT,
 *   cedula_cliente TEXT,
 *   id_usuario INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   UNIQUE(numero_factura, id_usuario)
 * );
 * 
 * -- 5. Detalles de las facturas
 * CREATE TABLE IF NOT EXISTS sale_details (
 *   id SERIAL PRIMARY KEY,
 *   id_venta INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
 *   id_producto INTEGER NOT NULL,
 *   producto_nombre TEXT NOT NULL,
 *   tasa_dia NUMERIC(10, 2) NOT NULL,
 *   cantidad INTEGER NOT NULL,
 *   precio_momento NUMERIC(10, 2) NOT NULL,
 *   exento_iva BOOLEAN DEFAULT false
 * );
 * 
 * -- 6. Sesiones de usuario (Refresh tokens)
 * CREATE TABLE IF NOT EXISTS sessions (
 *   id SERIAL PRIMARY KEY,
 *   jwtid TEXT UNIQUE NOT NULL,
 *   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * ─────────────────────────────────────────────────────────
 * ══════════════ FUNCIONES DE BASE DE DATOS ═══════════════
 * ─────────────────────────────────────────────────────────
 * -- (Requeridas por el Dashboard para hacer agrupaciones y sumas)
 * 
 * -- A. Tendencia de ventas
 * CREATE OR REPLACE FUNCTION get_sales_trend(p_user_id INT, p_start_date DATE)
 * RETURNS TABLE(dia DATE, total_bs NUMERIC, cantidad BIGINT) AS $$
 * #variable_conflict use_column
 * BEGIN
 *   RETURN QUERY
 *   SELECT DATE(fecha) as dia, COALESCE(SUM(total_bs), 0) as total_bs, COUNT(*) as cantidad
 *   FROM sales
 *   WHERE id_usuario = p_user_id AND DATE(fecha) >= p_start_date
 *   GROUP BY DATE(fecha);
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * -- B. Productos más vendidos
 * CREATE OR REPLACE FUNCTION get_top_products(p_user_id INT, p_start_date DATE)
 * RETURNS TABLE(nombre TEXT, total_vendido NUMERIC, total_usd NUMERIC, total_bs NUMERIC) AS $$
 * #variable_conflict use_column
 * BEGIN
 *   RETURN QUERY
 *   SELECT 
 *     sd.producto_nombre as nombre,
 *     SUM(sd.cantidad)::NUMERIC as total_vendido,
 *     COALESCE(SUM(sd.precio_momento * sd.cantidad), 0)::NUMERIC as total_usd,
 *     COALESCE(SUM(sd.precio_momento * sd.cantidad * sd.tasa_dia), 0)::NUMERIC as total_bs
 *   FROM sale_details sd
 *   JOIN sales s ON sd.id_venta = s.id
 *   WHERE s.id_usuario = p_user_id AND DATE(s.fecha) >= p_start_date
 *   GROUP BY sd.id_producto, sd.producto_nombre
 *   ORDER BY total_vendido DESC
 *   LIMIT 5;
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * -- C. Distribución fiscal del mes
 * CREATE OR REPLACE FUNCTION get_fiscal_distribution(p_user_id INT, p_year TEXT, p_month TEXT)
 * RETURNS TABLE(total_exento_bs NUMERIC, total_iva_bs NUMERIC, total_facturado_bs NUMERIC, total_facturas BIGINT) AS $$
 * #variable_conflict use_column
 * BEGIN
 *   RETURN QUERY
 *   SELECT 
 *     COALESCE(SUM(monto_exento_bs), 0)::NUMERIC as total_exento_bs,
 *     COALESCE(SUM(iva_monto_bs), 0)::NUMERIC as total_iva_bs,
 *     COALESCE(SUM(total_bs), 0)::NUMERIC as total_facturado_bs,
 *     COUNT(*)::BIGINT as total_facturas
 *   FROM sales
 *   WHERE id_usuario = p_user_id 
 *     AND TO_CHAR(fecha, 'YYYY') = p_year 
 *     AND TO_CHAR(fecha, 'MM') = p_month;
 * END;
 * $$ LANGUAGE plpgsql;
 */
console.log('📖 Por favor, copia el script de SQL dentro de apps/api/db/tables.js y ejecútalo en el SQL Editor de Supabase.');
