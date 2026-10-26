# gemini.md

## Resumen del entorno del proyecto

- **Lenguaje principal**: TypeScript (configurado en `tsconfig.json`).
- **Framework front‑end**: **Next.js 16** (ver `package.json` → dependencia `next`).
- **Estilo y UI**:
  - **Tailwind CSS** (`tailwindcss` como devDependency) con configuración en `tailwind.config.ts`.
  - Componentes UI con **Radix UI**, **@dnd-kit**, **@tremor/react**, **lucide‑react**, **clsx**, **class‑variance‑authority**.
- **Gestión de estado / APIs**: **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`).
- **Visualización de datos**: **ECharts** (`echarts`, `echarts-for-react`).
- **Generación de PDFs**: `jspdf` y `jspdf-autotable`.
- **Testing**: **Playwright** (`@playwright/test`).
- **Backend / Base de datos**: **Supabase** (PostgreSQL) con migraciones SQL bajo `supabase/migrations/`.
- **Herramientas de analítica**: `@vercel/analytics`.
- **Envío de correos**: `resend`.
- **Validación de datos**: `zod`.
- **Gestión de estilo**: `tailwind‑merge`.

## Tecnologías detectadas

| Categoría          | Tecnologías detectadas                               |
|--------------------|------------------------------------------------------|
| Front‑end          | Next.js, React 19, TypeScript, Tailwind CSS, Radix UI, dnd‑kit, Tremor, Lucide, clsx, class‑variance‑authority |
| Backend / DB       | Supabase (PostgreSQL), Supabase Edge Functions (posible) |
| Visualización      | ECharts, echarts‑for‑react                            |
| Testing            | Playwright                                            |
| CI / Deploy        | Vercel (implícito por `vercel.json`), Supabase CLI    |
| Otros              | Resend (email), Zod (validación), @vercel/analytics   |

## Recomendaciones para Gemini

- **Lenguaje**: `typescript`.
- **Framework**: `nextjs` (versión 16).
- **Base de datos**: `postgresql` (a través de Supabase).
- **Gestor de paquetes**: `npm` (lockfile `package-lock.json`).
- **Estilos**: `tailwindcss` con utilidad `tailwind-merge`.
- **Testing**: `playwright`.
- **Despliegue**: Vercel + Supabase.

Este archivo `gemini.md` puede ser usado por herramientas Gemini para entender la arquitectura y generar asistencias específicas.
