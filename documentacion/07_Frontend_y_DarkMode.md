# 7. Frontend Visual y Arquitectura de Interfaz (Astro + Tailwind v4)

El frontend de la plataforma de facturación está diseñado bajo estrictos estándares de usabilidad, estética moderna (glassmorphism, gradientes fluidos y micro-animaciones) y alto rendimiento. Está desarrollado con **Astro 6** y estilizado de forma nativa con **Tailwind CSS v4**.

## Estructura del Proyecto Web (`apps/client/src/`)

```text
apps/client/src/
├── components/
│   ├── navigation/
│   │   ├── Navbar.astro       # Barra superior con menús dinámicos y toggle solar/lunar
│   │   └── utils.js           # Lógica utilitaria de rutas y enlaces
│   ├── notification/          # Sistema de notificaciones emergentes (Toasts)
│   └── Spinner.astro          # Indicadores visuales de carga
├── features/
│   ├── auth/                  # Capa de servicios y almacenamiento reactivo para autenticación
│   └── inventory/             # Almacenamiento atómico en NanoStores y servicios de catálogo
├── layout/
│   ├── AppLayout.astro        # Plantilla maestra para el panel de administración (Dashboard/POS)
│   ├── PageLayout.astro       # Plantilla maestra para páginas de aterrizaje y acceso público
│   ├── PrivateRoute.astro     # Componente guardia para bloquear accesos no autorizados
│   └── PublicRoute.astro      # Componente guardia para redireccionar si ya existe sesión
├── pages/
│   ├── dashboard.astro        # Centro de estadísticas e indicadores clave en tiempo real
│   ├── forgot-password.astro  # Interfaz de solicitud de recuperación de contraseñas
│   ├── history.astro          # Registro histórico interactivo de facturas con modal lateral
│   ├── index.astro            # Página de inicio de aterrizaje comercial (Landing Page)
│   ├── inventory.astro        # Módulo de administración de productos y existencias
│   ├── login.astro            # Formulario de autenticación segura
│   ├── reset-password.astro   # Formulario seguro para el establecimiento de nueva clave
│   ├── sales.astro            # Interfaz bimonetaria de Punto de Venta (POS)
│   ├── signup.astro           # Registro de nuevos comercios con validación reactiva
│   └── verify/                # Páginas de confirmación de correo
└── styles/
    └── global.css             # Directivas globales e inicialización de Tailwind v4
```

---

## Sistema de Temas Oscuro / Claro (Dark Mode Toggle)

La alternancia entre apariencias visuales está optimizada para eliminar parpadeos molestos ("white flash") durante la carga inicial:

### 1. `global.css` — Configuración Variante Tailwind v4
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```
La directiva `@custom-variant` le indica al compilador de Tailwind v4 que active las reglas prefijadas con `dark:` cuando el nodo raíz `<html>` contenga la clase CSS `dark`.

### 2. Bloqueo Anti-Parpadeo (Inline Script)
En las cabeceras HTML de las plantillas base se inyecta un script síncrono que se ejecuta antes del renderizado de la página. Este script evalúa `localStorage` o la preferencia del sistema operativo (`window.matchMedia('(prefers-color-scheme: dark)')`), aplicando de inmediato la clase `dark` al DOM para asegurar una transición visual fluida.

### 3. `Navbar.astro` — Interactividad del Usuario
El botón de alternancia en la barra de navegación conmuta la clase `dark` en el documento, guarda la elección en `localStorage` para garantizar persistencia entre visitas y actualiza el icono visible de Sol a Luna instantáneamente.

---

## Catálogo de Vistas Principales

### 1. Página de Aterrizaje (`index.astro`)
- Titulares con gradientes modernos mediante la sintaxis `bg-linear-to-r from-indigo-600 to-violet-600`.
- Tarjetas informativas con efecto glassmorphism (transparencias y desenfoque de fondo).
- Diseño totalmente adaptativo (Mobile-First) con llamadas a la acción (CTAs) directas a los formularios de ingreso y registro.

### 2. Módulo de Autenticación (`login.astro` & `signup.astro`)
- Formularios interactivos con validación estricta del lado del cliente mediante Zod.
- Indicación visual instantánea de cumplimiento de contraseñas (longitud, mayúsculas, números).
- Indicadores de carga animados (Spinners) y notificaciones emergentes (Toasts) ante fallos o éxitos.

### 3. Recuperación de Credenciales (`forgot-password.astro` & `reset-password.astro`)
- Flujo en dos pasos limpio y seguro.
- Captura del token efímero directamente desde los parámetros de la URL.
- Estructura y diseño alineados a las mejores prácticas corporativas.

### 4. Panel de Control Comercial (`dashboard.astro`)
- Tarjetas de resumen estadístico que muestran: Total de productos registrados, Ventas emitidas en la jornada y Alertas tempranas de stock crítico (unidades ≤ 5).
- **Cálculo de Ingresos Bimonetarios**: Sumatoria de ventas en Bolívares con conversión al vuelo a Dólares calculada mediante la consulta automatizada a la API del BCV en segundo plano.
- Enlaces de acción rápida para iniciar una nueva venta o incorporar existencias.
