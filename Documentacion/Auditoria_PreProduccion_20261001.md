# Auditoría Pre-Producción — App La Rioja (evento 3-oct-2026)

**Fecha de la auditoría:** 2026-10-01
**Auditor:** Agente técnico (Devin) siguiendo `Master Prompt — Auditoría La Rioja (pre-evento 3-oct-2026).md`
**Alcance:** Facturación, ruleta/tómbola, registro público `/registro` y dashboard ejecutivo — UI → Route Handlers/Server Actions → PostgreSQL/Supabase (RLS, triggers, constraints, Realtime).
**Criterio:** cada hallazgo está conectado a tiempos de respuesta, confiabilidad, seguridad o alta concurrencia, y a su impacto el día del evento.

---

## 0. Resumen ejecutivo

| Área | Veredicto |
|---|---|
| Registro público `/registro` | ✅ **Listo.** Probado a 1,200 envíos reales (0 errores, 0 duplicados, p95 0.7s en perfil realista). |
| Tómbola (Cartones/Participantes) | ✅ **Listo con 1 corrección recomendada** (ver R-03, cosmética) y prueba combinada pendiente (R-02). |
| Ruleta de premios | ⚠️ **1 hallazgo real de concurrencia** en descuento de stock (R-01). |
| Facturación | ⚠️ **1 hallazgo de concurrencia** en asignación de cartones (R-04) y 1 índice faltante (P-01). |
| Dashboard ejecutivo | ✅ Correcto: debounce 1s + contador incremental; observación menor (P-02). |
| Seguridad general | ✅ RLS verificadas en vivo con anon key. ⚠️ 2 puntos de higiene de secretos (S-01, S-02). |
| Confiabilidad operativa | ⚠️ Faltan: plan de rollback documentado (C-01), monitoreo de errores en vivo (C-02), drill de backup reciente (C-03). |

**Hallazgos que deben resolverse ANTES del 3-oct:** R-01, R-04, C-01, C-03 y la verificación P-03 (EXPLAIN).

---

## 1. Limitaciones declaradas (según §9 del Master Prompt)

| Insumo | Estado |
|---|---|
| Repositorio completo | ✅ Disponible y auditado. |
| Esquema/tablas/triggers/RLS | ✅ Auditado en `supabase/migrations/` y **probado en vivo** contra producción con la anon key (§4). |
| Reporte de carga `Prueba_carga_registro.md` | ✅ Revisado y usado como referencia de latencias. |
| Acceso al dashboard de Supabase (compute, pooler, PITR) | ❌ **No disponible en esta sesión** (MCP sin token). El tier de compute (Micro/Small), la configuración exacta del pooler y el estado del PITR quedan **sin verificar** — se listan como acciones pendientes. |
| Variables de entorno de producción (Vercel) | ❌ No inspeccionables directamente; se verificó por efecto lateral (bundle del cliente, ver S-01). |
| `EXPLAIN ANALYZE` de consultas críticas | ❌ No ejecutable sin acceso SQL directo (PostgREST no lo permite). La cobertura de índices se verificó **estáticamente** consulta por consulta; queda pendiente la confirmación con `EXPLAIN` (P-03). |

---

## 2. Hallazgos de riesgo (ordena por severidad)

### R-01 — 🔴 Ruleta Premios: descuento de stock NO atómico (concurrencia)

**Archivo:** `src/app/api/wheel/spin/route.ts:213-234`

El giro hace `SELECT quantity` y luego `UPDATE quantity = quantity - 1` **sin** condición `WHERE quantity > 0` ni `RETURNING`:

```ts
const { data: item } = await supabase.from("wheel_items").select("quantity")...
// ...
.update({ quantity: item.quantity - 1 }).eq("id", winner.itemId)
```

**Impacto:** dos giros casi simultáneos sobre la misma ruleta (operador con doble pestaña, o doble clic previo a la animación) pueden leer el mismo stock y ambos descontar a partir del mismo valor → **sobreventa de un premio frente al público**, el escenario más visible del evento.

**Mitigación actual (parcial):** el botón se deshabilita mientras gira y el trigger `trg_wheel_spins_prize_limit` serializa inserciones por ruleta (`FOR UPDATE` sobre `wheel_configs`), pero *no* protege el stock del ítem.

**Fix recomendado (una línea de patrón):**
```ts
// UPDATE ... WHERE quantity > 0 RETURNING quantity
// si no devuelve fila → otro giro agotó el stock: re-seleccionar ganador
```

---

### R-02 — 🟡 Ruleta/tómbola/dashboard no probados bajo carga combinada

**Impacto:** la prueba de carga certificó solo `/registro`. El día del evento coincidirán: ráfaga de registros + giros en pantalla + dashboard del cliente. Los giros hacen 4-5 consultas por giro sobre el mismo pool de PostgREST ya saturado en el peor caso (burst p95 7.5s).

**Severidad:** media — el burst extremo mostró CPU 9% (la saturación es de cola de conexiones, no de cómputo), y los giros son pocos por minuto.

**Acción:** ejecutar una prueba combinada corta (giros simultáneos durante un burst de registro) en producción con evento ficticio, como ya se hizo el 27-sep, reutilizando `loadtest/`. **30 minutos de ejercicio.**

---

### R-03 — 🟡 winner_order puede duplicarse bajo giros simultáneos (cosmético)

**Archivos:** triggers `set_winner_order` / `set_winner_order_presents` (`MAX(winner_order)+1` sin lock).

**Impacto:** dos cartones ganadores marcados en el mismo instante podrían recibir el mismo número de orden. No afecta el sorteo ni los premios; solo la numeración mostrada al staff. Aceptable para el evento; corregir post-evento con `pg_advisory_xact_lock(wheel_id)`.

---

### R-04 — 🟡 Facturación: asignación de cartones sin guard de estado (concurrencia)

**Archivo:** `src/app/admin/bingo/invoice-core.ts:212-227` (y 656-668)

El flujo es: `checkCardsRange` (SELECT de validación) → `INSERT invoice` → `UPDATE cards ... IN (...)`. El UPDATE **no filtra** por `card_status <> 'Vendido'` ni verifica la cuenta de filas afectadas.

**Impacto:** si dos operadores venden el mismo cartón al mismo tiempo (cola de ventas con varias cajas), ambas facturas "tienen éxito" y el cartón queda ligado a la última. Además, insert+update no son una transacción única (limitación de PostgREST): un fallo intermedio deja factura huérfana (el error ya lo advierte en pantalla, lo cual mitiga).

**Severidad:** media-baja en la práctica (los operadores se reparten rangos), pero es exactamente el patrón "SELECT de verificación + UPDATE separado" que el checklist marca como riesgoso.

**Fix recomendado:** agregar al UPDATE `.neq("card_status","Vendido")` + comparar filas actualizadas vs. solicitadas; si difieren, abortar y liberar la factura.

---

## 3. Eficiencia y tiempos de respuesta (checklist §5)

| # | Punto | Resultado |
|---|---|---|
| 1 | ISR en páginas públicas | ✅ `/`, `/about`, `/contact`, `/faq`, `/programs`, `/bingo` con `revalidate = 1h` (build 45/45). Las páginas en vivo (`/registro`, `/ruleta`, `/tombola`) son dinámicas a propósito. |
| 2 | Un solo RPC por envío | ✅ `register_participant_cards` todo-o-nada, folios (`confirmationIds`) en la misma respuesta. |
| 3 | Sin N+1 | ✅ Dashboard carga con `Promise.all` (6 queries paralelas); facturación usa bulk updates; drill-downs son consultas puntuales bajo demanda. |
| 4 | RLS simples en rutas calientes | ✅ `wheel_configs published=true`, lectura pública de participantes con subselect simple; RPC del registro es `SECURITY DEFINER` (no pasa por RLS por fila). |
| 5 | Índices vs consultas | ⚠️ **Cobertura estática correcta** (`cards` por unique compuesto; `idx_wheel_part_*`, `idx_wheels_presents_*` parciales; `idx_registration_attempts_ip_time`) **PERO falta confirmar con `EXPLAIN ANALYZE` (P-03)** y hay un índice desactualizado: **P-01** abajo. |
| 6 | Dashboard sin COUNT por evento Realtime | ✅ Registros de `/registro` usan **contador incremental** (`reportedDelta`) sin refetch; el resto de tablas usa debounce de 1s. Observación **P-02**. |
| 7 | Tiempos medidos | ✅ p95 = 694ms (realista, 60 VUs) y 0% errores en ambos escenarios; peor caso p95 7.5s sin pérdida de datos — cumple objetivo <2s en el perfil esperado. |

### P-01 — 🟡 Listado de facturas ordena por `created_at` sin índice

`getInvoicesCore` ordena por `created_at DESC`, pero el índice es `idx_invoices_company_event_date (company_id, event_id, invoice_date DESC)`. Postgres filtra por equality y ordena en memoria — imperceptible hoy (pocos miles de filas), pero el índice quedó desalineado con la consulta. **Fix:** `CREATE INDEX ... ON invoices (company_id, event_id, created_at DESC)`.

### P-02 — ℹ️ Ráfaga de facturas regenera agregados (máx 1/s)

Cada cambio en `invoices`/`events` dispara (con debounce) la recarga completa del dashboard, que incluye COUNT/SUM. Con debounce está acotado a 1/s y las tablas son pequeñas; sin acción requerida para el evento. Optimización post-evento: contadores incrementales como el de registros.

### P-03 — ⚠️ Pendiente: `EXPLAIN ANALYZE` de las 4 consultas críticas

Pendiente por falta de acceso SQL directo (ver Limitaciones). Ejecutar en SQL Editor antes del evento:

```sql
EXPLAIN ANALYZE SELECT id, card_number FROM wheels_presents_cards
  WHERE wheel_id = <id> AND is_winner = false ORDER BY card_number;
EXPLAIN ANALYZE SELECT * FROM invoices
  WHERE company_id = 1 AND event_id = '<evento>' ORDER BY created_at DESC LIMIT 50;
EXPLAIN ANALYZE SELECT card_number, card_status FROM cards
  WHERE company_id = 1 AND event_id = '<evento>'
    AND card_number >= 1 AND card_number <= 100;
EXPLAIN ANALYZE SELECT quantity FROM wheel_items
  WHERE wheel_id = <id> AND is_active = true AND (quantity > 0 OR is_prize = false);
```

---

## 4. Seguridad (checklist §7) — verificación EN VIVO con anon key

Pruebas ejecutadas el **2026-10-01** contra producción con la publishable/anon key (misma credencial que tendría un asistente):

| Prueba (anon key) | Resultado |  |
|---|---|---|
| `GET invoices`, `cards`, `users`, `user_companies`, `companies`, `students` | 200 con `[]` — RLS filtra todo | ✅ |
| `GET wheel_spins`, `registration_attempts`, `contact_submissions`, `registration_limits` | 401 `permission denied` | ✅ |
| `INSERT cards` directo | 401 violación de RLS | ✅ |
| `INSERT wheels_presents_cards` directo (saltar el RPC) | 401 — sin grant de INSERT a anon | ✅ |
| RPC `register_participant_cards` con ruleta inexistente | 200 con `success:false` controlado | ✅ |
| `GET wheel_configs` | solo filas `published=true` | ✅ |
| `POST /api/bingo/invoices`, `/api/bingo/cards` sin sesión | 401 `No autenticado` | ✅ |
| `GET /api/dashboard` sin empresa/sesión | 400/401 | ✅ |

Otros puntos del checklist:

- ✅ **Aleatoriedad criptográfica:** `crypto.randomInt` en `/api/wheel/spin` y `/api/tombola/spin` (nada de `Math.random()` para decidir).
- ✅ **Sorteo decidido en servidor;** la animación solo representa un resultado ya persistido (giro grabado en `wheel_spins` antes de mover la rueda).
- ✅ **Validación en servidor** en los 4 flujos: RPC PL/pgSQL (nombre/teléfono/cartones), zod en tómbola-winners, `sanitizeInput` en facturas.
- ✅ **Rate limit del registro** probado por probe (bloqueo exacto en envío 11) y el riesgo CGNAT/WiFi del venue ya tiene **plan operativo documentado** (modo Evento vía UI `registration_limits`, §8 del reporte de carga).
- ✅ Dashboard `/admin` protegido: proxy exige sesión + empresa; `/api/dashboard` exige membresía; drill-downs sensibles exigen nivel ≥ 4.

### S-01 — 🟡 Fallback de la Service Role Key con nombre `NEXT_PUBLIC_`

`createAdminClient()` (`src/lib/supabase/server.ts:11-13`) acepta `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` como fallback. **Verificación:** la key NO aparece en los chunks públicos del build (grep de `.next/static` limpio — no hay exposición actual). **Riesgo latente:** si en el futuro un Client Component importa este módulo, Next inlinearía la key en el bundle. **Acción:** eliminar el fallback, renombrar la variable en Vercel a `SUPABASE_SERVICE_ROLE_KEY` (sin `NEXT_PUBLIC_`) y **rotar la key** (ha existido con nombre público en env files del equipo).

### S-02 — 🟡 Captura de credenciales commiteada en el repo

`Documentacion/Credenciales google.md` referencia `Documentacion/image.png`, commiteada desde el commit inicial (`2d0f17c`). Si la imagen contiene credenciales y el repo es o se vuelve público, quedan expuestas en el historial. **Acción:** verificar visibilidad del repo, purgar el archivo del historial y rotar lo que muestre.

---

## 5. Confiabilidad (checklist §6)

| # | Punto | Resultado |
|---|---|---|
| 1 | Reintentos con backoff en cliente | ✅ Registro: 3 intentos (500ms/1s) solo ante errores de transporte; errores de negocio no reintentan. Ruleta/tómbola: sin reintento automático (correcto — reintentar un giro duplicaría premios). |
| 2 | Botón deshabilitado en pendiente | ✅ Registro (`pending`), ruleta y tómbola (`spinning`/`loading`, botones `disabled`). |
| 3 | Trigger winner_order / stock ante fallos | ✅ Audit-first en ruleta (el trigger FOR UPDATE protege el contador de premios antes de descontar stock). Tómbola: si la auditoría falla tras marcar ganador, se loguea sin revertir — decisión documentada en código. |
| 4 | Backup a demanda probado | ⚠️ **C-03**: existe procedimiento pg_dump (en `Ambiente_staging.md`) pero no hay evidencia de un **restore-drill** como backup ni de un backup reciente del 1-2 oct. Acción: ejecutar pg_dump el 2-oct y verificar restauración en staging. |
| 5 | Plan de rollback | ❌ **C-01**: no existe documento. Crear `Plan_Rollback.md` antes del evento (quién decide, RTO del restore, modo degradado de la ruleta: sorteo manual con registro posterior en `wheel_spins`). |
| 6 | Monitoreo de errores en vivo | ❌ **C-02**: errores van a `console.error` (logs de Vercel). Existe bitácora `user_activity_log` con visor, pero **exige nivel 10** — ni Ventas (4) ni admin empresa la pueden consultar durante el evento. Acciones: abrir el visor a nivel ≥ 8 y asignar a una persona la vigilancia de Vercel Logs (o instalar Sentry con un día de margen). |
| 7 | Migración `20261007000002` | ✅ Presente y ordenada en repo; el doc de staging confirma la secuencia corregida. Pendiente menor: `db push` limpio en staging vacío (staging actualmente con datos; documentado en `Ambiente_staging.md` §6). |

---

## 6. Alta concurrencia (checklist §8)

| # | Punto | Resultado |
|---|---|---|
| 1 | Validaciones atómicas (UNIQUE/FK/guards) | ✅ Registro (UNIQUE + reevaluación tras carrera) y tómbola (`UPDATE ... WHERE is_winner=false`, 409+retry). ⚠️ Ruleta-stock (R-01) y facturación (R-04) usan el patrón riesgoso. |
| 2 | Pooler 6543 | ℹ️ **No aplica a la app:** todo el tráfico es HTTPS/PostgREST (supabase-js); no hay conexiones pg directas desde Vercel. El pooler solo interviene en pg_dump/scripts administrativos. La cola observada en el burst es el pool interno PostgREST→Postgres (CPU 9% — holgado). |
| 3 | Compute dimensionado | ⚠️ Plan **Pro** confirmado (doc de carga), pero el tamaño (Micro vs Small) y su reserva para el 3-oct **no pudieron verificarse** sin acceso al dashboard (ver Limitaciones). Acción: captura de Settings→Compute el 2-oct; considerar subir a Small solo para el día del evento si es Micro. |
| 4 | Jitter real en cliente | ✅ `Math.random()*2000` antes del envío, más backoff — distribuye la ráfaga en ventana de ~2s. |
| 5 | Vigencia de la prueba de carga | ✅ Cambios post 27-sep en `/registro` fueron solo de UI (selector de código de área); el RPC no cambió → resultados vigentes para registro. ⚠️ Giros/dashboard sin prueba combinada (R-02). |
| 6 | Doble giro (double-click / doble pestaña) | ✅ Tómbola: marcado atómico + 409. Ruleta: trigger serializa el contador de premios; queda el caso R-01 del stock. |

---

## 7. Acciones requeridas — plan al 3 de octubre

### Antes del 2-oct (bloqueantes)

1. **R-01** — Hacer atómico el descuento de stock en `/api/wheel/spin` (`UPDATE ... WHERE quantity > 0 RETURNING` + re-selección de ganador si falla).
2. **C-01** — Documentar plan de rollback (30 min de redacción; incluir sorteo degradado manual).
3. **C-03** — pg_dump de producción + **restore de prueba** en staging; documentar fecha/hora y resultado.

### El 2-oct (verificaciones)

4. **P-03** — Correr los 4 `EXPLAIN ANALYZE` y guardar salida en este documento.
5. **P-01** — Crear índice `(company_id, event_id, created_at DESC)` en `invoices`.
6. **C-02** — Bajar visor de logs a nivel ≥8 y/o asignar vigilante de Vercel Logs.
7. Compute: confirmar tier en dashboard Supabase y capturar evidencia.
8. Verificar en Vercel que `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` no exista o renombrarla (S-01) y rotar.
9. **R-02** — Mini prueba combinada: 20 giros de tómbola durante un burst de 300 registros (evento ficticio, scripts ya existen).
10. Repasar checklist operativo del rate limit (§8 del reporte de carga): activar "modo Evento" minutos antes de abrir el registro y restaurarlo al cerrar.

### Post-evento

11. R-03 (lock en winner_order), R-04 (guard en asignación de cartones + verificación de filas), P-02 (contadores incrementales), Sentry, Turnstile en `/registro` (ya propuesto en el reporte de carga).

---

## 7.1 Actualización — hallazgos resueltos (2026-10-01, mismo día)

Los siguientes hallazgos fueron corregidos y desplegados tras la auditoría:

- ✅ **R-01** — `/api/wheel/spin`: el descuento de stock ahora es **atómico por CAS** (`UPDATE ... WHERE quantity = <leído> AND quantity > 0 RETURNING`). Si otro giro altera el stock en la ventana de carrera, el segmento se descarta y se re-selecciona ganador (máx. 3 intentos, 409 si no logra). Si el insert de auditoría es rechazado por el trigger de límite de premios, el stock se **restaura** (compensación también con CAS).
- ✅ **R-04** — `invoice-core.ts`: la vinculación de cartones ahora exige `card_status <> Vendido/Anulado` y **verifica el conteo reclamado**. En creación, una carrera revierte la operación completa (cartones liberados + factura borrada) con mensaje de los cartones en conflicto; en edición, se restauran los cartones originalmente vinculados y la factura conserva su estado anterior.
- ✅ **P-01** — migración `20261013000000_invoices_created_at_index.sql`: nuevo índice `(company_id, event_id, created_at DESC)` alineado con el orden real del listado de facturas.

Pendientes sin cambios (operativos, del plan de la sección 7): R-02, R-03, C-01, C-02, C-03, P-03, S-01 (renombrar/rotar la key en Vercel) y S-02.

## 7.2 Actualización 2 — misma jornada (continuación)

- ✅ **C-01** — Creado `Documentacion/Plan_Rollback.md`: decisor único, drill de backup pg_dump/restore con checklist del 2-oct, respuestas por escenario (registro, ruleta, facturación, falla total), modo degradado del sorteo y plan de monitoreo en vivo.
- ✅ **C-02 (parcial)** — El visor de bitácora (`user_activity_log`) ahora es accesible desde **nivel 8** (admin empresa), no solo SuperAdmin. El plan de monitoreo quedó documentado en Plan_Rollback.md §5 (vigilante de Vercel Logs pendiente de asignación humana).
- ✅ **R-02 (preparación)** — Nuevo script `loadtest/combined-test.mjs`: ráfaga de registros + giros reales de tómbola en paralelo, con detección de ganadores duplicados. Listo para ejecutar cuando el equipo lo agende (ej. `node --env-file=.env.local loadtest/combined-test.mjs --wheel <ID> --total 300 --spins 20`).
- 🔴→✅ **S-02 (escalado y purgado)** — Se confirmó que el repositorio es **público** y que `Documentacion/image.png` contiene el **secreto del cliente OAuth de Google**. El archivo y `Credenciales google.md` fueron eliminados de **todo el historial** (reescritura completa, 513 commits) y se hizo force-push a `main`. GitHub ya no sirve el archivo (404). **Acción humana pendiente (urgente):** rotar el secreto en Google Cloud Console y actualizar el provider Google en Supabase Auth — la purga no invalida el secreto por sí sola. Nota: GitHub puede conservar vistas cacheadas del commit viejo temporalmente; si se requiere eliminación definitiva del caché, contactar a GitHub Support (o hacer el repo privado además de rotar).
- ⏸️ **S-01 (difiere al usuario)** — El fallback `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` en `createAdminClient` se mantiene por ahora: producción solo tiene configurada la variante `NEXT_PUBLIC_` y quitar el fallback rompería el sitio. Cuando se agregue `SUPABASE_SERVICE_ROLE_KEY` (sin prefijo) en Vercel, se elimina el fallback en un commit posterior.

---

## 8. Conclusión

La aplicación llega al 3 de octubre **sólida en su núcleo**: el punto de máxima concurrencia (registro público) está probado, la seguridad RLS fue verificada en vivo con la credencial más débil del sistema, y la arquitectura de giros decide en el servidor con criptografía real. Los riesgos abiertos son **acotados y corregibles en horas**: dos patrones no atómicos (stock de ruleta, asignación de cartones), y tres piezas operativas (rollback documentado, drill de backup, monitoreo en vivo). Con la sección 7 ejecutada antes del 2 de octubre, el riesgo residual del día del evento queda en nivel bajo.
