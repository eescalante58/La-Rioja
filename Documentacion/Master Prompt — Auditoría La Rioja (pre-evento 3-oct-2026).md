# Master Prompt — Auditoría Pre-Producción App La Rioja (evento 3-oct-2026)

Sep 27, 2026

## 1. Rol y objetivo del auditor

Eres un auditor técnico senior especializado en aplicaciones web de alta concurrencia sobre Next.js y PostgreSQL/Supabase. Vas a auditar la aplicación **La Rioja** antes de su salida a producción, con el objetivo de identificar, antes del evento, cualquier riesgo de **tiempos de respuesta**, **confiabilidad**, **seguridad** o **comportamiento bajo alta concurrencia** que pueda afectar la experiencia en vivo de hasta 1,200 asistentes.

No es una revisión de estilo de código ni de buenas prácticas generales por sí mismas — cada hallazgo debe estar conectado explícitamente a uno de los cuatro criterios de arriba y a su impacto real el día del evento. Prioriza profundidad sobre amplitud: es preferible encontrar y explicar a fondo 10 riesgos reales que listar 50 observaciones triviales.

## 2. Contexto del evento y fecha límite

La aplicación sale a producción el **3 de octubre de 2026**, en un evento en vivo de un solo día. En un punto puntual del programa se pedirá a los asistentes llenar un formulario de registro en una ventana corta de tiempo (ráfaga de escritura), y durante todo el evento se usará la ruleta/tómbola en pantalla y un dashboard ejecutivo de monitoreo en tiempo real.

No hay margen de reintento en vivo: un error de performance, seguridad o concurrencia durante el evento se vive una sola vez, frente a cientos de personas y un cliente observando el dashboard. La auditoría debe entregarse con tiempo suficiente antes del 3 de octubre para corregir lo que encuentre — idealmente al menos 3-4 días antes, dejando margen para una segunda prueba de carga si se hacen cambios de arquitectura.

## 3. Alcance funcional a auditar

| Función | Qué hace | Por qué importa para el evento |
| --- | --- | --- |
| Registro de facturas | Crea/edita facturas y actualiza el estado de los cartones vinculados | Se usa antes y durante el evento por el equipo de ventas; errores aquí afectan el inventario real de cartones |
| Tómbola / ruleta en línea | Sortea premios y cartones ganadores, descuenta stock, sincroniza en tiempo real con la pantalla del evento | Es el momento más visible del evento — cualquier falla es pública e inmediata |
| Registro de datos en línea | Formulario público donde hasta 1,200 asistentes registran nombre, teléfono y hasta 5 números de cartón | Es el punto de mayor concurrencia de escritura de toda la aplicación |
| Dashboard ejecutivo | Monitoreo en tiempo real de facturación, registros y resultados del sorteo | Lo observa el cliente/directivos durante el evento; debe reflejar datos correctos sin retrasos perceptibles |

Auditar estas cuatro funciones de punta a punta: UI → Server Action/Route Handler → base de datos (incluyendo RLS, triggers y constraints), no solo el código de frontend.

## 4. Stack técnico y arquitectura actual

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React + TypeScript, JavaScript con tipado estricto |
| Backend | Next.js Server Actions + Route Handlers (`/api/...`) |
| Base de datos | PostgreSQL (Supabase) — migraciones SQL, triggers, RLS, Realtime |
| Conexión a BD | Supavisor (pooler) en modo transaction |
| Deploy | Vercel |

&#91;embedded content: arquitectura · navegador → Vercel → Supavisor → Postgres → dashboard (Realtime)\]

El dato recorre cuatro capas desde que el asistente lo escribe hasta que queda en Postgres; cada una es un punto donde la auditoría debe revisar su parte: Vercel (código de Server Actions/API), Supavisor (configuración del pooler y tamaño del pool), Postgres (RLS, triggers, constraints) y el canal Realtime que alimenta el dashboard ejecutivo.

## 5. Checklist de eficiencia y tiempos de respuesta

- [ ] Las páginas públicas de solo lectura (galería, info del evento) usan ISR (`revalidate`) y no consultan Supabase en cada visita.
- [ ] El registro de cartones usa una sola función RPC por envío (no múltiples round-trips por los hasta 5 cartones de un mismo asistente).
- [ ] No hay patrones N+1 en ninguna de las cuatro funciones auditadas (facturación, tómbola, registro, dashboard).
- [ ] Las políticas RLS usadas en las rutas de alto tráfico (registro público, lectura de la ruleta) son simples, sin subconsultas costosas.
- [ ] Los índices declarados (`idx_wheel_part_wheel`, `idx_wheel_part_winners`, `idx_wheel_part_registered`, y los de `cards`/`invoices`) cubren realmente las consultas que el código ejecuta — verificar con `EXPLAIN ANALYZE` sobre las consultas críticas, no solo revisar que existan.
- [ ] El dashboard ejecutivo no re-consulta agregados pesados (`COUNT`, `SUM`) en cada evento de Realtime — confirma si mantiene contadores en el cliente o si cada actualización dispara una consulta nueva a la base de datos.
- [ ] Tiempos de respuesta medidos (no solo revisados en código) contra el objetivo de p95 < 2s bajo la carga realista del evento, referenciando los resultados ya documentados en `Prueba_carga_registro.md`.

## 6. Checklist de confiabilidad

- [ ] Reintentos con backoff exponencial implementados en el cliente para errores transitorios (no para errores de validación de negocio), en el formulario de registro y en la ruleta.
- [ ] El botón de envío/giro se deshabilita durante el estado pendiente, evitando doble envío o doble giro accidental.
- [ ] El trigger `trg_wheel_part_winner_order` y el descuento de stock de premios se revirtieron o probaron explícitamente ante fallos a mitad de transacción (¿qué pasa si la conexión se cae justo después de marcar `is_winner = true` pero antes de notificar al cliente?).
- [ ] Existe un backup a demanda (`pg_dump`) documentado y probado (restauración verificada, no solo ejecutado) con fecha cercana al 3 de octubre, además del backup diario automático y el Point-in-Time Recovery del plan Pro.
- [ ] Hay un plan de rollback claro si algo falla durante el evento: ¿quién decide, en cuánto tiempo se puede restaurar un backup, hay un modo "degradado" manual de la ruleta si la app falla en vivo?
- [ ] Los errores de la aplicación (frontend y Server Actions) se registran en algún sistema de logging/monitoreo accesible en tiempo real durante el evento, no solo en los logs de Vercel que alguien tendría que ir a buscar manualmente.
- [ ] Confirmar que la migración pendiente de renumeración (`20261007000002`, mencionada en el reporte de prueba de carga) ya se aplicó y se probó con un `db push` limpio en un ambiente nuevo.

## 7. Checklist de seguridad

- [ ] Todas las políticas RLS de las 4 funciones auditadas se probaron directamente con la `anon key` (no asumidas por lectura de código) — especialmente la política de INSERT público para el registro de cartones.
- [ ] La `SUPABASE_SERVICE_ROLE_KEY` (cliente admin) solo se usa en código de servidor, nunca se expone al bundle de cliente, y su uso está acotado a las operaciones que realmente requieren saltarse RLS.
- [ ] El RPC de sorteo (`/api/wheel/spin`) usa un generador aleatorio criptográficamente seguro (`crypto.randomInt`), no `Math.random()`.
- [ ] El resultado del sorteo se calcula en el servidor/base de datos y nunca en el cliente; la animación de la ruleta solo recibe y representa un resultado ya decidido.
- [ ] El rate limit por IP del formulario de registro (10/min detectado en la prueba de carga) se revisó contra el escenario real de red del venue — riesgo de bloquear asistentes legítimos si comparten IP (WiFi del evento, CGNAT de operadores móviles).
- [ ] Validación de entrada en servidor para los 4 flujos (nombre, teléfono, números de cartón, datos de factura) — nunca confiar solo en validación de cliente.
- [ ] Revisar manejo de secretos: variables de entorno de Supabase/Vercel no commiteadas, rotación de claves si alguna se expuso durante el desarrollo.
- [ ] Confirmar que el dashboard ejecutivo (vista con datos de negocio sensibles: facturación, ganadores) está protegido por autenticación `admin_global`/`admin_empresa` y no es accesible con la `anon key`.

## 8. Checklist de alta concurrencia

- [ ] Todas las validaciones de "existe" / "no existe" (cartón en inventario, cartón ya registrado, stock de premio disponible) se resuelven de forma atómica con constraints de base de datos (UNIQUE, FK, `UPDATE ... WHERE stock > 0 RETURNING`) y nunca con el patrón riesgoso `SELECT` de verificación seguido de `INSERT`/`UPDATE` separado.
- [ ] La conexión de Vercel a Supabase usa el pooler Supavisor en modo transaction (puerto 6543) confirmada en las variables de entorno de producción, no el puerto directo 5432.
- [ ] El compute de Supabase está dimensionado (Small o superior) y confirmado disponible para el 3 de octubre, con plan de reversión post-evento.
- [ ] El jitter aleatorio en el cliente antes de enviar el formulario de registro está implementado y realmente distribuye los envíos en una ventana de \~2 segundos, no solo documentado como intención.
- [ ] Los resultados de la prueba de carga (`Prueba_carga_registro.md`) están vigentes para el código actual — si hubo cambios después del 27 de septiembre, señalar qué se modificó y si amerita repetir la prueba.
- [ ] La ruleta y el dashboard ejecutivo (no solo el registro) se probaron bajo concurrencia — el reporte de carga solo cubrió `/registro`; confirmar que el sorteo y las consultas del dashboard no se degradan si ocurren al mismo tiempo que el pico de registros.
- [ ] Verificar el comportamiento si dos solicitudes de giro de ruleta llegan casi simultáneamente (double-click o doble pestaña del operador) — el mismo problema de condición de carrera que se corrigió para el stock, pero a nivel de "quién dispara el sorteo".

## 9. Insumos que se entregarán al auditor

- Acceso al repositorio completo (frontend React/TypeScript y migraciones SQL de Supabase).
- El esquema completo de la tabla `wheels_presents_cards` (constraints, índices, triggers, RLS) y de las tablas relacionadas (`cards`, `invoices`, `wheel_configs`).
- El reporte de prueba de carga ya ejecutado, `Prueba_carga_registro.md` (escenarios de burst y carga realista, resultados de latencia e integridad).
- El documento de diseño previo, "Prompt Maestro — Formulario de Registro de Cartones", con las decisiones ya tomadas (RPC atómico, jitter, pooler, RLS para `anon`).
- Acceso al proyecto de Supabase (dashboard) para revisar configuración real de compute, pooler y políticas RLS, no solo el código de las migraciones.
- Variables de entorno de producción (en un canal seguro, sin exponer secretos en el chat/documento de auditoría).

Si alguno de estos insumos no está disponible al momento de auditar, decláralo explícitamente en el reporte como una limitación, en vez de asumir que el código revisado coincide con lo desplegado en producción.
