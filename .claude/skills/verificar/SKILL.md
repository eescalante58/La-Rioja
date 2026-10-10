---
name: verificar
description: Verifica los cambios de código de La Rioja antes de dar una tarea por terminada o de hacer commit. Úsala siempre después de modificar archivos en src/, supabase/ o configuración.
---

# Verificación de cambios en La Rioja

Sigue estos pasos en orden y reporta el resultado de cada uno.

> Qué ya cubren los hooks (no repetirlo como sustituto, pero tampoco confiar solo en ellos):
>
> - `PostToolUse` (`.claude/hooks/prettier.mjs`): formatea con Prettier cada archivo que Claude edita. **No** incluir un paso de formato.
> - `.githooks/pre-push`: corre `npx tsc --noEmit` (y `npm run build` solo con `PREPUSH_BUILD=1`) y bloquea force-push/borrado de `main`. Actúa **solo al hacer push**; esta skill adelanta esa verificación al momento del cambio.

1. **Rama:** ejecuta `git branch --show-current`. Debe ser `main` (flujo por turnos, ver `CLAUDE.md`). Si no, detente y avísame.
2. **Alcance del cambio:** lista los archivos modificados con `git status --short` (incluye archivos nuevos sin seguimiento) y `git diff HEAD --stat`. Si ya hay commits sin subir, incluye también `git diff origin/main...HEAD --stat`. Los pasos siguientes se aplican sobre esa lista.
3. **Tipos:** `npx tsc --noEmit`.
4. **Build:** `npm run build`.
5. **Pruebas:**
   - Si tocaste páginas públicas (`/`, `/about`, `/programs`, `/faq`, `/contact`, `/login`) o componentes de layout: `npm run test:responsiveness`. Es lo único que cubre la suite de Playwright actual.
   - Si tocaste `/registro`, `/ruleta`, `/tombola` o `/admin/bingo`: no hay pruebas automáticas. Levanta el dev server con `preview_start` (`dev` en `.claude/launch.json`), abre la página afectada y revisa la consola y las peticiones de red (regla obligatoria de `CLAUDE.md`).
6. **Reglas del repo** (revisa solo las líneas agregadas o modificadas, con `git diff HEAD` y el contenido de archivos nuevos):
   - Sin `router.refresh()` ni Server Actions llamadas desde Client Components (`"use client"`); usar Route Handlers o `callAction`/`callActionForm` (`src/lib/action-client.ts`). Sin `<form action={serverAction}>` en páginas en vivo.
   - Suscripciones de Supabase Realtime nuevas con debounce ≥ 1 s o delta incremental.
   - Todo Route Handler nuevo bajo `/api/bingo` o `/api/dashboard` usa `checkAdmin`. Toda acción nueva expuesta en `REGISTRY` (`src/app/api/actions/route.ts`) tiene guard (`withRole`/`withCompanyAccess`).
   - Sin `any` nuevo, y funciones nuevas con JSDoc. El código existente ya tiene `any` heredados: no reportarlos salvo que estén en líneas modificadas.
   - Ninguna variable `NEXT_PUBLIC_*` contiene secretos, y `createAdminClient` / `SUPABASE_SERVICE_ROLE_KEY` no se usan en archivos `"use client"`.
   - Sin secretos ni llaves escritos en el código.
   - Migraciones nuevas en `supabase/migrations/`: `ALTER TYPE ... ADD VALUE` fuera de transacción.

## Formato de respuesta

Tabla con cada paso: ✅ pasó / ❌ falló / ⚠️ no aplica, y lista de lo que falló con archivo y línea.

Esta skill no hace commit ni push: solo reporta y propone correcciones. El commit y el push se hacen después, según el flujo de `CLAUDE.md`, únicamente si todo pasó.
