---
trigger: always_on
---

# Regla: PROHIBIDO gatillar un re-render completo de página

## Contexto

Invocar una **Server Action** desde un **Client Component** obliga a Next.js a
re-renderizar el RSC payload completo de la página en cada respuesta.
`/admin/bingo` es pesada (~minutos en producción) y durante el evento en vivo
eso es inaceptable: la cola de ventas, la ruleta y el monitoreo realtime no
pueden esperar un re-render por operación.

Toda operación disparada desde el cliente que solo necesita **datos** debe ir
por un **Route Handler** (`/api/**`) que responde JSON puro.

## PROHIBIDO

- Importar e invocar funciones de archivos `"use server"` (Server Actions)
  desde componentes `"use client"` de páginas admin — en especial
  `/admin/bingo`, el dashboard `/admin` y las páginas en vivo
  (`/ruleta`, `/tombola`, `/registro`).
- Suscripciones de Supabase Realtime que invoquen Server Actions sin
  debounce ni delta incremental (una ráfaga de INSERTs gatilla un re-render
  por cada evento).
- `<form action={serverAction}>` en formularios de alta frecuencia dentro de
  páginas pesadas.
- `router.refresh()` como mecanismo de refresco de datos en componentes de
  operación en vivo.

## OBLIGATORIO

- Lecturas/escrituras desde client components → Route Handlers en
  `src/app/api/**/route.ts` respondiendo `{ success, data | error }`.
- Guard de autorización: `checkAdmin(companyId)` en los handlers
  `/api/bingo/*` (rol ≥ 4 + membresía de empresa). Nunca exponer datos admin
  sin ese guard.
- Lógica compartida: si una Server Action y un Route Handler hacen lo mismo,
  ambos consumen una función `*-core.ts` (patrón establecido en
  `invoice-core.ts`) — no duplicar código.
- Refresco de datos → `fetch('/api/...')` + `setState` local del componente.
- Realtime con ráfagas → debounce ≥ 1 s o contador incremental (ver patrón
  `reportedDelta` en `RealtimeDashboardWrapper`).

## Excepciones permitidas

- Server Actions **leídas en el servidor** (Server Components, `page.tsx`,
  carga inicial SSR): no gatillan re-render extra.
- Acciones de auth/navegación (`login`, `logout`, `select-company`).
- Páginas aisladas y ligeras de settings/CMS con operaciones puntuales:
  tolerado, pero preferir Route Handler para consistencia.

## Checklist de revisión (PR / cambios nuevos)

- [ ] ¿La llamada se dispara desde un `"use client"`? → debe ir a `/api/*`.
- [ ] ¿La página es pesada o se opera en vivo durante el evento? → `/api/*`
      obligatorio.
- [ ] ¿La respuesta es solo datos? → JSON; el RSC re-render es desperdicio.
- [ ] ¿Hay suscripción Realtime? → verificar debounce/delta.

## Deuda conocida (pendiente de migrar)

Ya migrados a Route Handlers: dashboard completo (`/api/dashboard`),
ciclo de factura (GET/POST/PUT/DELETE `/api/bingo/invoices`,
`/api/bingo/cards`, `/api/bingo/whatsapp`), inventario de cartones.

Pendientes del inventario original de la auditoría: gestión de ruletas
(`WheelTab`/`WheelConfigDialog`/`WheelItemsDialog`: `getWheels`,
`getWheelSpins`, `toggleWheelPublished`, `deleteWheelConfig`,
`saveWheelConfig`, `saveWheelItems`), diálogos de inventario
(`updateSingleCard`, `updateCardType`, `updateCardRangeType`),
carga/generación de cartones (`uploadCardsBatch`, `generateCards`,
`clearEventCards`, `logUploadActivity`, `verifyUpload`), `saveEvent`,
`PromotionalTab` (clientes/promos/WhatsApp batch),
`getPublicWheelData`/`getPublicTombolaData` en páginas públicas.
Toda modificación sobre estos archivos debe migrar la operación a
Route Handler en lugar de añadir más Server Actions.
