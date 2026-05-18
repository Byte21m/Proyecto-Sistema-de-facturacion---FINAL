# 5. Diagramas y Estructura Organizativa

> **Tip:** Para visualizar estos diagramas de forma interactiva en VSCode, abre este archivo y presiona `Ctrl + Shift + V` (requiere la extensión **Markdown Preview Enhanced** o el soporte nativo de Markdown).

La representación gráfica de la arquitectura y los flujos de datos facilita enormemente el estudio y mantenimiento del sistema. A continuación, se presenta la radiografía visual de la plataforma.

## 1. Organización del Repositorio (Arquitectura Monorepo)

El proyecto adopta un enfoque modular basado en características (Feature-Driven Architecture), separando el servidor API del cliente web visual dentro de una estructura monorepo limpia:

```text
sistema-facturacion/
├── apps/
│   ├── api/                              (Servidor Backend - Puerto 3000)
│   │   ├── db/
│   │   │   ├── index.js                  # Inicialización y conexión SQLite (WAL)
│   │   │   └── tables.js                 # DDL de creación de tablas
│   │   ├── features/
│   │   │   ├── auth/                     # Controladores y rutas de autenticación
│   │   │   ├── product/                  # Gestión de inventario y stock
│   │   │   ├── sale/                     # Transacciones POS y registro de ventas
│   │   │   └── user/                     # Registro de nuevos comercios
│   │   ├── services/
│   │   │   └── nodemailer.js             # Integración de mensajería SMTP Gmail
│   │   ├── .env                          # Variables de entorno y secretos criptográficos
│   │   ├── index.js                      # Punto de entrada y middlewares globales
│   │   └── test.http                     # Batería de pruebas manuales REST Client
│   └── client/                           (Frontend Web - Puerto 4321)
│       └── src/
│           ├── components/               # Navbar, Spinners y Toasts de notificación
│           ├── features/                 # Lógica cliente (Auth, Inventario, Carrito)
│           ├── layout/                   # Layouts de página y guardias de ruta
│           ├── pages/                    # Vistas Astro (Dashboard, POS, Historial)
│           └── styles/
│               └── global.css            # Configuración Tailwind v4 y Dark Mode
└── documentacion/                        # Base documental técnica para estudio
```

---

## 2. Diagrama de la Base de Datos (Relaciones y Multi-tenancy)

El modelo relacional garantiza el aislamiento por comercio (cada usuario es un "tenant") y la integridad transaccional en las ventas:

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "mantiene"
    USERS ||--o{ PRODUCTS : "administra"
    USERS ||--o{ SALES : "emite"
    SALES ||--|{ SALE_DETAILS : "contiene"
    PRODUCTS ||--o{ SALE_DETAILS : "facturado en"

    USERS {
        int id PK
        string email UK
        string password_hash
        boolean email_verified
    }
    SESSIONS {
        int id PK
        string jwtid UK
        int user_id FK
    }
    PRODUCTS {
        int id PK
        string nombre
        float precio_dolar
        int stock
        int user_id FK
    }
    SALES {
        int id PK
        datetime fecha
        float total_bs
        int id_usuario FK
    }
    SALE_DETAILS {
        int id PK
        int id_venta FK
        int id_producto FK
        float tasa_dia
        int cantidad
        float precio_momento
    }
```

---

## 3. Flujo de Punto de Venta (POS) e Integración BCV

El proceso de venta involucra consultas externas, cálculos bimonetarios al vuelo y transaccionalidad estricta en el servidor:

```mermaid
flowchart TD
    A["Cajero ingresa al Punto de Venta (/sales)"] --> B["Frontend consulta API DolarAPI (Tasa BCV)"]
    B --> C["Se muestra catálogo de productos disponibles"]
    C --> D["Cajero agrega productos al Carrito"]
    D --> E["Cálculo automático de totales en USD y Bs"]
    E --> F["Cajero confirma y presiona 'Registrar Venta'"]
    F --> G["Envío de payload JSON a POST /api/sale"]
    G --> H["Servidor inicia Transacción SQLite (db.transaction)"]
    H --> I{"¿Stock suficiente en todos los ítems?"}
    I -- "No (Stock agotado)" --> J["Rollback automático + Retorna Error 400"]
    I -- "Sí" --> K["Inserta en tabla sales el encabezado"]
    K --> L["Resta stock en tabla products"]
    L --> M["Inserta líneas en tabla sale_details con tasa y precio inmutables"]
    M --> N["Commit de la transacción + Retorna Venta Exitosa"]
    N --> O["Frontend limpia carrito y actualiza catálogo"]
```

---

## 4. Flujo de Recuperación de Contraseña

Secuencia blindada para la restauración de acceso sin comprometer la seguridad de las cuentas:

```mermaid
flowchart TD
    A["Usuario solicita POST /api/auth/forgot-password"] --> B{"¿Existe el correo en la DB?"}
    B -- "No" --> C["Retorna mensaje estándar de éxito (Evita enumeración)"]
    B -- "Sí" --> D["Firma JWT de recuperación con vida útil de 15 minutos"]
    D --> E["Nodemailer despacha correo con enlace único"]
    E --> C
    C --> F["Usuario abre correo y accede a /reset-password?token=..."]
    F --> G["Ingresa nueva clave y envía POST /api/auth/reset-password"]
    G --> H{"¿Token válido y vigente?"}
    H -- "Expirado o Inválido" --> I["Retorna Error 403: Enlace Caducado"]
    H -- "Correcto" --> J["Encripta nueva clave con bcrypt"]
    J --> K["Actualiza password_hash en la tabla users"]
    K --> L["Purga todas las sesiones activas en la tabla sessions"]
    L --> M["Retorna Éxito: Contraseña Actualizada"]
```

---

## 5. Sistema de Temas (Dark Mode Toggle)

Funcionamiento del cambio de apariencia con persistencia en el cliente:

```mermaid
flowchart TD
    A["Usuario accede a la aplicación web"] --> B{"¿Existe preferencia en localStorage?"}
    B -- "Sí, dark" --> C["Añade clase 'dark' a la etiqueta html"]
    B -- "Sí, light" --> D["Remueve clase 'dark' de la etiqueta html"]
    B -- "Sin preferencia" --> E{"¿Preferencia del sistema operativo (media query)?"}
    E -- "Prefiere Oscuro" --> C
    E -- "Prefiere Claro" --> D
    C --> F["Muestra icono de Sol en Navbar"]
    D --> G["Muestra icono de Luna en Navbar"]
    F --> H["Clic en botón de alternancia"]
    G --> H
    H --> I["Alterna clase 'dark' en el DOM"]
    I --> J["Guarda nueva elección en localStorage"]
    J --> K["Actualiza el icono visible de forma instantánea"]
```
