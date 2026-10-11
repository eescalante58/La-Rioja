---
name: verificar
description: Verifica los cambios de código de La Rioja antes de dar una tarea por terminada o de hacer commit, incluida la revisión en tamaño iPhone 13 de todo cambio visible en pantalla. Úsala siempre después de modificar archivos en src/, supabase/ o configuración.
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
   - Si tocaste páginas públicas (`/`, `/about`, `/programs`, `/faq`, `/contact`, `/login`), componentes de layout o `globals.css`: `npm run test:responsiveness`. Es lo único que cubre la suite de Playwright actual.
   - Si tocaste `/registro`, `/ruleta`, `/tombola` o `/admin/bingo`: no hay pruebas automáticas. Levanta el dev server con `preview_start` (`dev` en `.claude/launch.json`), abre la página afectada y revisa la consola y las peticiones de red (regla obligatoria de `CLAUDE.md`).
6. **Apto para iPhone 13 (no Pro):** obligatorio si el cambio afecta **lo que se ve en pantalla**: componentes `.tsx` con markup, estilos, `globals.css`, `tailwind.config.ts` o gráficas. Si el cambio no es visible (tipos, acciones de servidor, rutas `/api`), marca ⚠️ no aplica.
   - **Dispositivo de referencia:** iPhone 13 estándar del dueño: 390×844 px CSS. En Safari vertical el área visible con las barras es de unos **390×664**. En horizontal es 844×390.
   - **Cómo:** `preview_start` (`dev`), `resize_window` a **390×664** y abre cada pantalla afectada, incluidos los modales y menús que cambiaron. Si la página pide sesión, pide al usuario que inicie sesión en el panel; nunca escribas credenciales.
   - **Mide con JavaScript, no solo a ojo** (las capturas del panel salen reducidas):
     - Sin scroll horizontal de la página: `document.documentElement.scrollWidth <= innerWidth`.
     - Tablas, tarjetas y contenedores: `scrollWidth <= clientWidth`; ningún texto ni monto cortado.
     - Botones y enlaces nuevos o modificados con al menos **44 px** de alto (área táctil).
     - Inputs de diálogos con letra de **16 px** o más (si no, iOS hace zoom al enfocar): usar la clase `.dialog-mobile`.
     - Menús y modales: el contenido clave cabe en 664 px o tiene scroll propio; el borde inferior respeta `env(safe-area-inset-bottom)`.
     - Gráficas ECharts: etiquetas completas y sin encimarse. Para verlas a tamaño útil, exporta el canvas con `toDataURL()` y muéstralo ampliado en una capa temporal.
   - **Horizontal (844×390):** revísalo también si la pantalla se usa en vivo durante el evento (`/registro`, `/ruleta`, `/tombola`, `/admin/bingo`).
   - **Escritorio sin regresiones:** comprueba en **1440×900** que la pantalla se vea como antes.
   - **Reglas aprendidas en este proyecto:**
     - No dependas de las `media` queries internas de ECharts: no se aplicaron en Safari de iOS. Mide el contenedor con `ResizeObserver` y arma la opción en React (ver `DailySalesChart.tsx`).
     - No uses el breakpoint `xs:`: no existe en `tailwind.config.ts`. El menor es `sm:` (640 px).
     - Las celdas de Tremor traen `p-4` y `whitespace-nowrap`; en celular usa `.dash-compact-table` o `MobileCardTable` (`src/components/admin/MobileCardTable.tsx`).
     - El selector CSS `:has()` requiere iOS 15.4 o superior.
   - **Limitación:** el panel emula el tamaño de pantalla, no el motor WebKit de Safari. Después de desplegar, pide al usuario que confirme en su iPhone 13; si ve la versión anterior, que cierre la pestaña de Safari y vuelva a abrir el sitio.
   - **Al terminar:** restaura el panel (`resize_window` con preset `desktop`) y quita las capas o estilos temporales que hayas agregado para medir.
7. **Reglas del repo** (revisa solo las líneas agregadas o modificadas, con `git diff HEAD` y el contenido de archivos nuevos):
   - Sin `router.refresh()` ni Server Actions llamadas desde Client Components (`"use client"`); usar Route Handlers o `callAction`/`callActionForm` (`src/lib/action-client.ts`). Sin `<form action={serverAction}>` en páginas en vivo.
   - Suscripciones de Supabase Realtime nuevas con debounce ≥ 1 s o delta incremental.
   - Todo Route Handler nuevo bajo `/api/bingo` o `/api/dashboard` usa `checkAdmin`. Toda acción nueva expuesta en `REGISTRY` (`src/app/api/actions/route.ts`) tiene guard (`withRole`/`withCompanyAccess`).
   - Sin `any` (el proyecto quedó sin ningún `any` explícito; usar los tipos de `@/types/*`) y funciones nuevas con JSDoc.
   - Ninguna variable `NEXT_PUBLIC_*` contiene secretos, y `createAdminClient` / `SUPABASE_SERVICE_ROLE_KEY` no se usan en archivos `"use client"`.
   - Sin secretos ni llaves escritos en el código.
   - Migraciones nuevas en `supabase/migrations/`: `ALTER TYPE ... ADD VALUE` fuera de transacción.

## Formato de respuesta

Tabla con cada paso: ✅ pasó / ❌ falló / ⚠️ no aplica, y lista de lo que falló con archivo y línea. En el paso 6 incluye las medidas tomadas (ancho de contenido contra ancho visible, alturas) para cada pantalla revisada.

Esta skill no hace commit ni push: solo reporta y propone correcciones. El commit y el push se hacen después, según el flujo de `CLAUDE.md`, únicamente si todo pasó.
