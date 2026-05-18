# 8. Módulo Profesional de Inventario, Punto de Venta (POS) e Historial

El núcleo operativo de la plataforma para los comercios está compuesto por la gestión de existencias, el proceso de facturación en el Punto de Venta (POS) y la auditoría de ventas. Esta arquitectura combina un estado reactivo en el cliente web con transaccionalidad atómica en el servidor.

---

## 1. Gestión de Inventario y Almacenamiento Reactivo (`inventory.astro` & `inventoryService.js`)

Para garantizar que el catálogo de productos y existencias se mantenga perfectamente sincronizado entre múltiples pantallas sin recargas de página, el sistema emplea el gestor atómico **NanoStores**.

### El Almacén Reactivo (`inventoryStore`)
Ubicado en `apps/client/src/features/inventory/inventoryService.js`, define un átomo de estado (`atom([])`) al cual se suscriben tanto la lista de administración de inventario como la cuadrilla de productos del Punto de Venta.

### Sincronización Bidireccional
- **Lectura (`loadInventoryFromServer`)**: Invoca la ruta protegida `GET /api/product` utilizando el cliente HTTP autenticado `ky`. Al recibir la lista de productos del usuario autenticado, actualiza el estado atómico en memoria. Cualquier componente suscrito al almacén se re-renderiza de inmediato.
- **Creación y Edición**: Las operaciones de agregar, modificar precio o reabastecer stock envían la petición REST al backend, actualizan SQLite y de inmediato refrescan el almacén reactivo, garantizando consistencia absoluta en la interfaz visual.

---

## 2. Punto de Venta Bimonetario (POS — `sales.astro`)

El Punto de Venta es una interfaz de alta velocidad y cero fricción para los cajeros, concebida para operar de forma impecable en la economía venezolana mediante facturación dual (USD/Bs).

```text
+---------------------------------------------------------------------------+
|  Punto de Venta                                         [Recargar BCV]    |
|  +-----------------------------------+ +--------------------------------+ |
|  | [ Buscar producto... ]  [+ Nuevo] | | Tasa del día: 36.50 Bs/$       | |
|  +-----------------------------------+ +--------------------------------+ |
|  | Productos Disponibles             | | Carrito de Compras           | |
|  |  [📦] Cable USB-C  $5.00 (Stk:10) | |  Cable USB-C  [-] 2 [+] [$10]  | |
|  |  [📦] Monitor 24" $120.00 (Stk:3) | |                                | |
|  +-----------------------------------+ | Totales: $10.00 | Bs 365.00    | |
|                                        | [   REGISTRAR VENTA EXITOSA  ] | |
|                                        +--------------------------------+ |
+---------------------------------------------------------------------------+
```

### Características Clave del POS
1. **Integración BCV Automatizada**: Al ingresar a la vista, el cliente realiza un fetch en segundo plano a la API pública de DolarAPI (`https://ve.dolarapi.com/v1/dolares/oficial`). La tasa promedio oficial se inyecta automáticamente en el campo de cálculo. El cajero cuenta además con un botón de **Recarga Manual** para refrescar la tasa en cualquier instante.
2. **Búsqueda Instantánea en Memoria**: La barra de búsqueda filtra en tiempo real la lista de productos almacenados en `inventoryStore` sin demoras de red.
3. **Registro Rápido (Quick Add Modal)**: El botón "+ Nuevo" abre una ventana emergente que permite registrar un nuevo producto en el inventario y agregarlo automáticamente al carrito de compras en un solo flujo continuo.
4. **Carrito de Compras Reactivo**: Permite incrementar o disminuir cantidades con controles +/-. El sistema bloquea de forma inteligente la adición de unidades si se excede el stock físico disponible en el inventario.
5. **Cálculo Simultáneo al Vuelo**: Cada modificación en el carrito o en el campo de la tasa de cambio recalcula instantáneamente los totales en Dólares y Bolívares.

---

## 3. Transaccionalidad Atómica en el Servidor (`sale.repository.js`)

Cuando el cajero confirma la compra y presiona "Registrar Venta", el cliente construye un payload estructurado y lo envía a `POST /api/sale`:

```json
{
  "total_bs": 365.00,
  "tasa_dia": 36.50,
  "items": [
    {
      "id_producto": 1,
      "cantidad": 2,
      "precio_momento": 5.00,
      "tasa_dia": 36.50
    }
  ]
}
```

### Garantía ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad)
El servidor procesa la venta utilizando una transacción atómica de SQLite (`db.transaction()`):
1. Inserta el registro del encabezado en la tabla `sales` con la fecha y hora exactas.
2. Recorre el arreglo de ítems vendidos. Para cada producto, ejecuta una consulta estricta de reducción de inventario:
   ```sql
   UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
   ```
   **Bloqueo Concurrente**: Si dos vendedores intentan vender simultáneamente la última unidad de un producto, la condición `AND stock >= ?` fallará para uno de ellos. El servidor detectará que `changes === 0`, lanzará una excepción y ejecutará un **rollback automático**, abortando la compra y evitando inventarios con saldos negativos.
3. Inserta cada ítem en `sale_details`, grabando de forma inmutable el precio unitario y la tasa de cambio de ese segundo exacto.

---

## 4. Auditoría e Historial de Facturas (`history.astro`)

La pantalla de historial permite a los administradores consultar todas las transacciones realizadas.
- **Listado y Filtros**: Las facturas se ordenan cronológicamente y pueden filtrarse instantáneamente por fecha.
- **Detalle Modal / Panel Lateral**: Al hacer clic sobre cualquier transacción, se despliega un panel lateral interactivo que muestra el desglose completo de artículos comprados, precios unitarios en dólares y bolívares, y la tasa aplicada durante la operación.
