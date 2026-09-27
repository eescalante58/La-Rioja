# Prueba de carga — Registro público de cartones (/registro)

**Fecha:** 2026-09-27 (UTC) — 18:05 y 18:10
**Ejecutado por:** Devin (agente) + monitoreo de dashboard por el equipo
**Estado:** ✅ Completada — resultados documentados abajo

---

## 1. Objetivo

Validar que el RPC `register_participant_cards` soporta el pico de registro del
evento: hasta **1,200 asistentes** enviando el formulario público `/registro`
en una ventana corta, según el ítem de aceptación del Prompt Maestro.

## 2. Entorno

| Parámetro | Valor |
|---|---|
| Proyecto Supabase | `wfkqsifhxnarmxrvbgiu` (Bingo Larioja2026, **plan PRO**) |
| Entorno | **Producción**, con datos de prueba aislados por `event_id` |
| Decisión de entorno | No existe proyecto staging; se ejecutó en producción con un evento ficticio dedicado (`TESTCARGA01`) y limpieza total posterior. Aprobado por el equipo. |
| Target | `POST {SUPABASE_URL}/rest/v1/rpc/register_participant_cards` (misma vía del navegador real) |
| Auth | anon/publishable key (igual que un asistente) |
| Herramienta | Script Node.js 24 propio (`loadtest/load-test.mjs`), fetch nativo, VUs con rampa |

## 3. Datos de prueba (seed — `loadtest/seed.mjs`)

| Recurso | Detalle |
|---|---|
| Evento | `TESTCARGA01` — company_id 1, status Activo |
| Ruleta | `wheel_configs` id=**6**, modo Participantes, published=true |
| Factura | `LOADTEST-SEED` (exige CHECK `cards_sold_requires_invoice`) |
| Cartones | 5,000 con `card_status='Vendido'`, rango 900001–905000 |

Las migraciones vigentes quedaron verificadas **por comportamiento**:
rate limit aplicando (ver §5.1) y `confirmationIds` en la respuesta.

## 4. Verificación previa (probe — `loadtest/probe-xff.mjs`)

| Prueba | Resultado |
|---|---|
| 14 envíos misma IP falsa | Bloqueo exacto en el envío 11 → límite de 10/min por IP **activo** |
| 14 envíos con IPs distintas | Todos pasan → `x-forwarded-for` llega a la función y segmenta buckets |

Conclusión: el test simuló 1,200 IPs distintas (`x-forwarded-for` único por
envío), por lo que **los límites de producción NO se alteraron** — se midió el
código real con sus defensas activas.

## 5. Resultados

### 5.1 Escenario A — Peor caso (burst extremo)

1,200 envíos, **300 VUs**, rampa 30s → todos en ~30 segundos.

| Métrica | Valor |
|---|---|
| Enviados / exitosos / fallidos | 1,200 / **1,200** / **0** |
| Error rate | **0%** |
| p50 | 1,664 ms |
| p95 | **7,542 ms** |
| p99 | 10,397 ms |
| max | 11,532 ms |
| Duración total | 29.9 s |
| Filas insertadas | 4,796 (+1 smoke) |
| Duplicados | 0 (verificado 4,797/4,797 únicos) |
| Dashboard (captura del equipo) | CPU 9%, Memoria 54%, Disk IO 1% |

**Lectura:** cero errores y cero pérdida de datos incluso con 300 peticiones
verdaderamente simultáneas; la latencia se degrada por **encolamiento de
conexiones** PostgREST→Postgres, no por saturación de cómputo (CPU 9%).

### 5.2 Escenario B — Carga realista del evento

1,200 envíos, **60 VUs**, rampa 60s → repartidos en ~1 minuto.

| Métrica | Valor |
|---|---|
| Enviados / exitosos / fallidos | 1,200 / **1,200** / **0** |
| Error rate | **0%** |
| p50 | **203 ms** |
| p95 | **694 ms** ✅ (< 2s objetivo) |
| p99 | 1,051 ms |
| max | 1,448 ms |
| Duración total | 59.0 s |
| Filas insertadas | 4,796 |
| Duplicados | 0 (4,796/4,796 únicos) |

## 6. Verificación de integridad

- `COUNT(*)` en `wheels_presents_cards` por `event_id='TESTCARGA01'`:
  escenario A = 4,797 filas; escenario B = 4,796 filas.
- `COUNT(DISTINCT card_number)` = total de filas en ambos escenarios
  → **la constraint `uq_wheels_presents` impidió todo doble registro**,
  incluyendo las carreras del burst de 300 concurrentes.
- `registration_attempts`: ~1,229 filas del período del test (log por IP
  funcionando; retención automática de 24h).

## 7. Conclusiones y recomendaciones

1. **El sistema está listo para el evento.** En el perfil realista (~60
   registros concurrentes) el p95 es de 0.7s — holgado contra el objetivo de 2s.
2. **El peor caso imaginable** (todo el público enviando en el mismo segundo)
   no produce errores ni pérdida; solo cola — el registro más lento tardó 11.5s.
   Con el jitter/retry del formulario real la experiencia sigue siendo correcta.
3. **La atomicidad y anti-abuso quedaron probadas bajo estrés:** todo-o-nada,
   sin duplicados, rate limit por IP efectivo, `confirmationIds` emitidos.
4. **Margen opcional:** si se quiere absorber incluso el burst extremo, subir
   el tamaño del pool de conexiones (Supavisor `db_pool_size`) o el compute el
   día del evento; con los valores actuales ya se cumple el objetivo.
5. **Pendiente de repo:** la migración de rate limit fue renumerada a
   `20261007000002` para que un replay ordenado (`db push` en staging futuro)
   no falle — la tabla `wheels_presents_cards` se crea en `20261007000000`.

## 8. ⚠️ HALLAZGO CRÍTICO — rate limit por IP vs. venue con red compartida

### El riesgo

El rate limit por IP **nunca fue probado bajo la condición real del evento**:
la prueba simuló 1,200 IPs distintas a propósito. Pero el día del evento:

- Si el venue ofrece **WiFi compartido** a los asistentes, todos los celulares
  salen a internet por **la misma IP pública** (o unas pocas).
- Con datos móviles, operadores en El Salvador usan **CGNAT** (varios usuarios
  comparten una IP pública).

Consecuencia con los límites actuales (`20261007000002`):

| Límite | Efecto en IP compartida |
|---|---|
| 10 envíos/min por IP | El asistente #11+ del mismo minuto es bloqueado aunque sea real. Se autorregula con reintentos (~10/min), pero genera mala experiencia. |
| **40 cartones/día por IP+evento** | **El fallo grave**: con ~4 cartones por persona, el asistente ~#10–13 agota el cupo de toda la IP. **Todos los demás quedan bloqueados 24 h** con "Se alcanzó el límite de registros por hoy". |
| 30 cartones por teléfono | No afecta: cada asistente usa su propio número. |

### Operación el día del evento (checklist)

**Vía UI (recomendada):** Admin → Configuración → **Límites de Registro** —
un clic cambia entre modo `normal` y `evento` (lee/escribe la tabla
`registration_limits`, migración `20261008000000`). Los scripts SQL en
`loadtest/` quedan como contingencia si el admin no está disponible.

1. **ANTES de abrir el registro** (momento del QR): Configuración →
   Límites de Registro → **"Activar modo Evento"** — eleva los límites a
   `500 envíos/min`, `15,000 cartones/día por IP`, `30 por teléfono`
   (dimensionado para 1,200 asistentes detrás de UNA sola IP).
   *Contingencia SQL: `loadtest/raise_limits.sql`.*
2. **Verificar**: `node --env-file=.env.local loadtest/probe-xff.mjs` →
   las 14 llamadas deben devolver `passed`.
3. **Durante el registro** (monitoreo anti-abuso en vivo, SQL Editor):
   ```sql
   SELECT client_ip, COUNT(*) AS intentos
   FROM public.registration_attempts
   WHERE attempted_at > now() - interval '10 minutes'
   GROUP BY client_ip ORDER BY 2 DESC;
   ```
   Una IP con miles de intentos = enumeración en curso → pulsar
   **"Restaurar modo Normal"** de inmediato.
4. **AL CERRAR el registro**: Configuración → Límites de Registro →
   **"Restaurar modo Normal"**.
   *Contingencia SQL: re-ejecutar `20261007000002_registration_rate_limit.sql`
   o `loadtest/restore_limits.sql`.*
5. **Verificar restauración**: el probe debe bloquear desde la llamada 11.

### Fix permanente (post-evento)

Para no depender de este paso manual en futuros eventos: Cloudflare Turnstile
en `/registro` (gratis, invisible para humanos). Requiere que la escritura pase
por un endpoint del servidor para validar el token — cambio mayor, planificar
con calma.

## 9. Artefactos y limpieza

- Scripts: `loadtest/probe-xff.mjs`, `loadtest/seed.mjs`,
  `loadtest/load-test.mjs`, `loadtest/cleanup.sql` (reutilizables).
- Operación día del evento: `loadtest/raise_limits.sql` (elevar límites),
  `loadtest/restore_limits.sql` (restaurar) — ver §8.
- Resultados crudos: `loadtest/loadtest-result-*.json`.
- Limpieza post-test: `wheels_presents_cards`, `cards`, `wheel_configs`,
  `invoices`, `events` de `TESTCARGA01` y `registration_attempts` de las IPs
  ficticias (`203.%`) — ejecutado vía service role tras documentar.
- Datos reales del negocio: **intactos** (el test solo tocó el evento ficticio).
