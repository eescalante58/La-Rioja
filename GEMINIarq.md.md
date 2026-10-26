## Architecture & Modern Web Guidelines

El agente DEBE aplicar estrictamente las directivas modernas de desarrollo web y las restricciones del proyecto en cada tarea de generación, rediseño o refactorización:

1. **Arquitectura de Componentes y Flujo de Datos:**
   - **RSC por defecto:** Implementar componentes bajo React Server Components (RSC). Utilizar `'use client'` exclusivamente en hojas del árbol que requieran interactividad del navegador o hooks de estado.
   - **Mutaciones Cliente → Servidor (REGLA CRÍTICA):** No invocar Server Actions directamente desde componentes `'use client'` en páginas de alto tráfico o tiempo real (`/admin/bingo`, `/admin`, `/ruleta`, `/tombola`, `/registro`), ya que re-renderizan el payload RSC completo.
     - Las mutaciones y consultas del cliente deben consumir Route Handlers (`src/app/api/**/route.ts`) retornando `{ success, data | error }`, o usar el despachador `callAction(name, args)` / `callActionForm(...)` desde `src/lib/action-client.ts` registrado en `POST /api/actions`.
     - Prohibido el uso de `router.refresh()` o `<form action={serverAction}>` en vistas interactivas del evento.
     - Las Server Actions directas se reservan exclusivamente para SSR inicial en Server Components y flujos de autenticación/navegación (`/auth/*`).
     - La lógica compartida entre Server Actions y Route Handlers debe residir en módulos `*-core.ts`.
   - **Suscripciones Supabase Realtime:** Debounce obligatorio (≥ 1 s) o aplicación de deltas incrementales para evitar saturación de re-renderizados.

2. **Tipado y Convenciones de Código:**
   - Tipado estricto de extremo a extremo en TypeScript. Prohibido terminantemente el uso de `any` (tipar props con interfaces, genéricos en `useState<T>`, eventos de React y esquemas Zod en `src/lib/validation/`). La única excepción admitida es el payload de Supabase Realtime casteado a su tipo de tabla.
   - Documentar funciones y componentes clave con JSDoc.

3. **Estilizado y Sistema de Diseño (Tailwind CSS 3):**
   - Utilizar clases utilitarias de Tailwind evitando CSS en línea o estilos globales redundantes.
   - Enfoque mobile-first estricto (`sm:`, `md:`, `lg:`).
   - Uso coherente de tokens y variables semánticas (`bg-background`, `text-foreground`, `border-border`, etc.) para dar soporte armónico a temas claro/oscuro.
   - Microinteracciones accesibles: transiciones fluidas en hover, active y `focus-visible`.

4. **Accesibilidad (a11y) y Estructura Semántica:**
   - Cumplir estándares WCAG AA con contraste cromático suficiente.
   - Estructura semántica en HTML5 (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, `<aside>`).
   - Todos los elementos interactivos deben ser operables mediante teclado y contener etiquetas accesibles (`aria-label`, `aria-describedby`).

5. **Rendimiento Web y Core Web Vitals:**
   - Optimización de imágenes con `next/image` especificando dimensiones fijas y limitando el atributo `priority` a recursos LCP.
   - Reducción del bundle cliente: carga diferida mediante `next/dynamic` para modales, paneles pesados y pestañas administrativas.
   - Fuentes tipográficas gestionadas vía `next/font`.

6. **Reglas de Refactorización:**
   - Modularizar componentes extensos con principio de responsabilidad única.
   - Desacoplar la lógica de estado/negocio de la capa visual usando custom hooks o utilidades del servidor.
   - Aplicar ediciones quirúrgicas en el código existente; no reescribir archivos enteros sin necesidad.