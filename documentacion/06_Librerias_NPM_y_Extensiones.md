# 6. Librerías (NPM) y Extensiones de VSCode

> **Tip:** Presiona `Ctrl + Shift + V` para visualizar este documento renderizado con todas las tablas y formato.

Para el desarrollo del sistema de facturación se ha implementado un stack tecnológico de vanguardia, dividiendo las dependencias entre el backend (Express) y el frontend (Astro).

## 1. Librerías del Servidor Backend (`apps/api/package.json`)

Estas dependencias constituyen el motor lógico, de persistencia y de seguridad de la API:

| Librería | Versión | Rol Arquitectónico |
|---|---|---|
| **express** | `^5.2.1` | Framework principal del servidor web. Orquesta el enrutamiento y la pila de middlewares. |
| **better-sqlite3** | `^12.9.0` | Driver síncrono ultrarrápido para SQLite. Opera en modo WAL para transacciones concurrentes. |
| **bcrypt** | `^5.1.1` | Algoritmo criptográfico de derivación de claves para hashear contraseñas de forma segura. |
| **jsonwebtoken** | `^9.0.2` | Generador y validador de pasaportes digitales JWT (Access Tokens, Refresh Tokens, Email Tokens). |
| **zod** | `^3.22.4` | Validador estricto de esquemas de datos entrantes (cuerpos de peticiones HTTP). |
| **nodemailer** | `^8.0.6` | Motor de mensajería SMTP para la entrega automatizada de correos de confirmación y recuperación. |
| **cors** | `^2.8.6` | Middleware de seguridad que autoriza peticiones cruzadas (Cross-Origin) desde el cliente web. |
| **cookie-parser** | `^1.4.7` | Analizador de cabeceras de cookies para la gestión e intercepción segura del Refresh Token. |

---

## 2. Librerías del Cliente Visual Frontend (`apps/client/package.json`)

Estas dependencias impulsan la interactividad, estilización y reactividad de la interfaz web:

| Librería | Versión | Rol Arquitectónico |
|---|---|---|
| **astro** | `^6.0.5` | Framework web de alto rendimiento y arquitectura de islas para generar las páginas estáticas y dinámicas. |
| **tailwindcss** | `^4.2.1` | Framework CSS utilitario en su versión más reciente v4 con motor Vite integrado. |
| **ky** | `^2.0.0` | Cliente HTTP avanzado y ergonómico basado en la API nativa de Fetch. Maneja intercepción y parseo JSON. |
| **nanostores** | `^1.2.0` | Gestor de estado atómico y reactivo ultraligero. Sincroniza el inventario y el carrito en tiempo real entre componentes. |
| **zod** | `^4.3.6` | Replicación de esquemas de validación en el cliente para dar retroalimentación visual inmediata en formularios. |

---

## 3. Extensiones de VSCode Esenciales

Para un desarrollo óptimo y eficiente dentro del entorno de Visual Studio Code, se recomiendan las siguientes herramientas:

| Extensión | ID de Catálogo | Propósito y Uso |
|---|---|---|
| **REST Client** o **HttpYac** | `humao.rest-client` | Permite ejecutar peticiones HTTP directamente desde el archivo `test.http` sin necesidad de Postman. |
| **Astro** | `astro-build.astro-vscode` | Habilita resaltado de sintaxis, formateo y autocompletado avanzado para los archivos `.astro`. |
| **Markdown Preview Enhanced** | `shd101wyy.markdown-preview-enhanced` | Permite previsualizar este y otros documentos con renderizado nativo de diagramas Mermaid. |
| **SQLite Viewer** | `qwtel.sqlite-viewer` | Interfaz gráfica integrada para explorar y auditar visualmente las tablas del archivo `database.db`. |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Proporciona autocompletado instantáneo y previsualización de colores para las clases utilitarias. |
