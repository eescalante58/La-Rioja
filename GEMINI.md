# GEMINI.md

This file provides guidance to Gemini AI Antigravity when working with code in this repository.

## Project

La Rioja — Centro de Formación Laboral: public institutional site (CMS-driven) + Bingo module (backoffice + live-event operation: card inventory, sales/invoicing, student card assignment, WhatsApp promos, wheel/tómbola draws, public card registration for ~1,200 attendees, realtime executive dashboard). Next.js 16 App Router (Turbopack) + React 19 + TypeScript strict, Tailwind 3, Tremor/ECharts, Supabase (Postgres + Auth + Realtime + Storage). Deployed on Vercel; pushing to `main` auto-deploys production. UI text, docs, and commit messages are in Spanish (conventional commits, e.g. `fix(students): ...`).

## Commands

```bash
npm run dev                      # http://localhost:3000
npx tsc --noEmit                 # typecheck (standard pre-commit check)
npm run build                    # production build (standard pre-commit check)
npm run test:responsiveness      # Playwright (starts dev server; runs 5 viewport projects)
npx playwright test -g "<title>" --project="Desktop (1440x900)"   # single test / single viewport
```

- `npm install` needs `--legacy-peer-deps` (set in `.npmrc` / `vercel.json`).
- Env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`), `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN`, `WHEEL_SALT`.
- DB migrations live in `supabase/migrations/*.sql` and are applied manually (Supabase SQL Editor or `supabase db push`). `ALTER TYPE ... ADD VALUE` must run outside a transaction.
- Load tests: `node --env-file=.env.local loadtest/<script>.mjs ...` (see header comment of each script).

## Architecture

# Directivas de Desarrollo y Arquitectura Web

## Principios de Diseño y Modern Web Guidelines

El agente DEBE aplicar estrictamente las directivas modernas de desarrollo web en cada tarea de generación, rediseño o refactorización:

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

### Client → server data flow (critical rule)

From `.devin/rules/no-rerender-completo.md`: calling a Server Action from a `"use client"` component re-renders the whole RSC payload, which is unacceptable on heavy/live pages (`/admin/bingo`, `/admin`, `/ruleta`, `/tombola`, `/registro`).

- Client components must fetch data via Route Handlers (`src/app/api/**/route.ts`) returning `{ success, data | error }`, then update local state. Do not use `router.refresh()` or `<form action={serverAction}>` on live/heavy pages.
- Existing Server Actions (`actions.ts` files under `src/app/admin/**`) are exposed to the client through the whitelist dispatcher `POST /api/actions` (`src/app/api/actions/route.ts`, `REGISTRY` keyed `"dominio.accion"`). Call them with `callAction(name, args)` / `callActionForm(name, formData, leadingArgs)` from `src/lib/action-client.ts`. To expose a new operation, register it in `REGISTRY`.
- Server Actions are only called directly for SSR initial loads in Server Components and for auth/navigation (login, logout, select-company).
- When a Server Action and a Route Handler share logic, put it in a `*-core.ts` module (`src/app/admin/bingo/invoice-core.ts`, `whatsapp-core.ts`, `src/app/admin/dashboard-core.ts`).
- Supabase Realtime subscriptions that can burst must debounce (≥1 s) or apply incremental deltas (see `reportedDelta` in `src/components/admin/RealtimeDashboardWrapper.tsx`).

### Auth & multi-tenancy

- `src/proxy.ts` (Next 16 proxy, formerly middleware) refreshes the Supabase session, redirects unauthenticated `/admin/*` to `/login`, and forces `/auth/select-company` until the `selected_company_id` cookie is set.
- Role levels (`src/lib/auth/authorization.ts`): SuperAdmin 10, Admin 8, Editor 6, Operator 4. `requireRoleLevel(min)` + `requireCompanyAccess(companyId)` (membership in `user_companies`).
- Guards: Server Actions wrap with `withRole` / `withCompanyAccess` (`src/lib/auth/guards.ts`); `/api/bingo/*` and `/api/dashboard` handlers call `checkAdmin(companyId, minLevel=4)` (`src/app/api/bingo/check-admin.ts`) → 401/403 JSON. Never expose admin data without one of these.
- Supabase clients: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` → `createClient()` (cookie session, RLS), `createStaticClient()` (no cookies, public/ISR), `createAdminClient()` (service role, bypasses RLS — server-only).

### Domains

- Public site pages (`/`, `/about`, `/programs`, `/contact`, `/faq`, `/bingo` gallery) render CMS content from `site_content`, `faqs`, `event_gallery`.
- Live event: `/registro` → RPC `register_participant_cards` (atomic, IP/phone rate-limited); `/ruleta` (canvas wheel, `wheel_configs`/`wheel_items`); `/tombola` + `/tombola/monitor` (draws over `wheel_participating_cards` or `wheels_presents_cards`, winners in realtime). Draw logic is server-side (`/api/wheel/spin`, `/api/tombola/spin`).
- Admin: `/admin` dashboard, `/admin/bingo` (tabs loaded via `next/dynamic`: events, inventory, sales/invoices, promo WhatsApp via UltraMsg, wheels/tómbolas), `/admin/cms`, `/admin/settings/*`.
- Zod schemas per domain in `src/lib/validation/`.

## Code conventions (from `.devin/rules/`)

- Document code with JSDoc.
- No `any`: type props with interfaces, use `useState<T>` generics, React event types, Zod at external boundaries, `unknown` for unknown data. Only exception: Supabase Realtime `payload.new/old` cast to the known table type.

## Git workflow (mandatory — turn-based work on `main`)

Claude Code and Devin work on `main` in this same folder, **never at the same time**. Every push to `main` deploys to production. Full procedure: `Documentacion/Plan_Flujo_Main.md` (Devin's copy of these rules: `.devin/rules/flujo-git.md`).

- **Start of turn:** `git status` — if there are uncommitted changes from another agent, tell the user and don't touch them. Then `git pull --ff-only origin main`.
- **During:** small conventional commits in Spanish. Test with `npm run dev` before pushing changes that affect `/registro`, `/ruleta`, `/tombola` or `/admin/bingo`.
- **End of turn:** leave the working tree clean (committed and pushed, or discarded after telling the user) and check that the Vercel deployment is _Ready_.
- **Forbidden:** `--force`, `--no-verify`, `reset --hard` on published work, disabling `.githooks` (`core.hooksPath`). The `.githooks/pre-push` hook rejects force-push/deletion of `main` and runs `tsc --noEmit` before every push.
- **Freeze:** on live-event days, no push to `main` without explicit approval from the user.
- **If production breaks:** Vercel Instant Rollback to the previous deployment, then fix with a new commit (never rewrite history).

## Documentation

`Documentacion/` holds the technical manual (`Manual_Tecnico.md` — full DB schema, RPCs, triggers, RLS, routes), user manuals, staging setup (`Ambiente_staging.md`), rollback plan, and audit reports.

Este archivo `GEMINI.md` puede ser usado por herramientas Gemini para entender la arquitectura y generar asistencias específicas.
