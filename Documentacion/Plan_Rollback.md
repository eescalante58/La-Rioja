# Plan de Rollback y Contingencia — Evento La Rioja (3-oct-2026)

**Propósito:** definir quién decide, en cuánto tiempo se actúa y qué hacer si
algo falla durante el evento en vivo. Complementa la auditoría
`Auditoria_PreProduccion_20261001.md` (hallazgos C-01 y C-03).

---

## 1. Roles y decisión

| Rol | Responsable | Qué decide |
|---|---|---|
| **Decisor de contingencia** | Coordinador del evento (una sola persona nombrada) | Declarar contingencia, ordenar rollback o modo degradado. Nadie más toma esta decisión en vivo. |
| **Operador técnico** | Responsable de la consola admin | Ejecuta lo decidido (restaurar, pausar ruleta, elevar/restaurar límites). |
| **Vigilante de monitoreo** | Persona asignada frente al dashboard + logs | Reporta síntomas al decisor en < 2 min (ver §5). |

Regla de oro: **ante la duda, usar el modo degradado (§4) y seguir el evento**;
el sistema se repara después. Nunca detener el programa por intentar un fix en vivo.

---

## 2. Backup previo al evento (drill — ejecutar el 2 de octubre)

1. **pg_dump de producción** (requiere el DB password de Supabase):

   ```powershell
   pg_dump "postgresql://postgres:PASS_PROD@db.wfkqsifhxnarmxrvbgiu.supabase.co:5432/postgres" `
     --schema=public --format=custom --file=backup_pre_evento_20261003.dump
   ```

   *(Si la conexión directa falla por IPv6, usar la cadena Session pooler del
   dashboard de Supabase, puerto 5432, usuario `postgres.<ref>`.)*

2. **Restore de prueba en staging** (verifica que el backup sirve, no solo que existe):

   ```powershell
   pg_restore "postgresql://postgres:PASS_STAGING@db.<ref-staging>.supabase.co:5432/postgres" `
     --schema=public --no-owner --no-privileges backup_pre_evento_20261003.dump
   ```

   Verificación mínima tras el restore (SQL Editor de staging):

   ```sql
   SELECT (SELECT COUNT(*) FROM events)        AS events,
          (SELECT COUNT(*) FROM cards)         AS cards,
          (SELECT COUNT(*) FROM invoices)      AS invoices,
          (SELECT COUNT(*) FROM wheel_spins)   AS spins;
   ```

   Los conteos deben coincidir con producción al momento del dump.

3. **Registrar en este documento:** fecha/hora del dump, tamaño del archivo y
   resultado del restore (✅/❌). Rellenar:

   - Dump ejecutado: `____ 2026-10-__ __:__`
   - Tamaño: `____ MB`
   - Restore en staging: `____`
   - Verificado por: `____`

Además del dump manual, el plan Pro de Supabase incluye backup diario y
Point-in-Time Recovery (PITR) — el dump es la vía rápida y local; PITR es la
red de seguridad gestionada.

---

## 3. Escenarios y respuestas

### 3.1 El formulario `/registro` se satura o rechaza asistentes reales

**Síntomas:** asistentes reportan "Demasiados intentos" o "límite de registros por hoy".

**Respuesta (ya documentada en `Prueba_carga_registro.md` §8):**

1. Configuración → **Límites de Registro** → *Activar modo Evento*
   (500 envíos/min, 15,000 cartones/día por IP).
2. Verificar con `node --env-file=.env.local loadtest/probe-xff.mjs`.
3. Al cerrar el registro: *Restaurar modo Normal*.

**Rollback asociado:** ninguno — es un cambio de configuración reversible en segundos.

### 3.2 La ruleta o la tómbola fallan en pantalla (error al girar)

**Síntomas:** el operador presiona Girar y recibe error, o la pantalla no avanza.

**Respuesta:**

1. Refrescar la pantalla pública (botón F5 del control flotante) — el estado
   vive en el servidor; el último ganador sigue grabado en `wheel_spins`.
2. Si persiste: verificar en Gestión de Bingo → Sorteos/Juegos que la ruleta
   siga publicada y con stock/participantes.
3. Si el servicio sigue caído → **modo degradado (§4)**.

**Importante:** cada giro exitoso ya quedó auditado en `wheel_spins` con hash
de verificación; nada se pierde aunque la pantalla muera a mitad de la animación.

### 3.3 Facturación lenta o con errores

**Síntomas:** "Error al guardar la factura" repetido.

**Respuesta:** cambiar a modo offline en papel/Excel (registrar N° factura,
cliente, cartones) y **capturar después** — el sistema permite facturas con
fecha anterior (`FECHA` editable). El inventario se regulariza al recapturar.

### 3.4 Falla grave de la aplicación completa (Vercel/Next.js)

**Respuesta:** modo degradado de todo el evento (§4). Si el DNS/dominio es el
problema, probar el dominio alterno de Vercel (`la-rioja.vercel.app`).

### 3.5 Datos corruptos o borrados por error humano

**Respuesta (rollback a backup):**

1. El decisor aprueba la restauración.
2. Opción rápida para UNA tabla: exportar las filas afectadas desde el dump
   estándar de Supabase (SQL Editor) o del `backup_pre_evento_*.dump` con
   `pg_restore --table=<tabla>` hacia una tabla temporal y hacer `INSERT ... SELECT`
   de las filas faltantes.
3. Opción completa: restaurar desde el backup diario de Supabase
   (Dashboard → Database → Backups) o PITR al punto previo al incidente.

**Estimación de tiempos (RTO):**

| Vía | Tiempo típico |
|---|---|
| Liberar límites de registro (UI) | < 1 min |
| Restaurar filas puntuales de una tabla | 10-20 min |
| Restore completo desde backup diario/PITR | 30-60 min (fuera del evento) |

---

## 4. Modo degradado del sorteo (sin aplicación)

Si ruleta/tómbola quedan inutilizables en vivo:

1. **Sorteo físico/manual:** la ruleta física de respaldo o tomar papeles con
   números de cartón en una tómbola física (el staff los tiene como respaldo
   del programa).
2. **Registro manual de cada premio:** anotar cartón ganador, nombre, documento
   y premio en la hoja de control impresa.
3. **Posterior al evento:** registrar de forma administrativa los ganadores
   con el endpoint del monitor (`/tombola/monitor`) o directo en la base para
   mantener el historial y la trazabilidad.

El modo degradado **no detiene el programa**: los premios se entregan igual y
la data se regulariza después.

---

## 5. Monitoreo en vivo durante el evento

- **Dashboard `/admin`** siempre visible (ventas, registros en vivo).
- **Visor de logs:** Admin → Configuración → Bitácora (ahora accesible a
  nivel ≥ 8) para ver acciones recientes de usuarios.
- **Logs de Vercel:** el vigilante mantiene abierto
  `vercel.com → proyecto la-rioja → Logs` filtrado por `ERROR`.
- **Consulta anti-abuso del registro** (SQL Editor, cada 15-30 min durante el
  registro masivo):

  ```sql
  SELECT client_ip, COUNT(*) AS intentos
  FROM public.registration_attempts
  WHERE attempted_at > now() - interval '10 minutes'
  GROUP BY client_ip ORDER BY 2 DESC;
  ```

- **Métricas de Supabase:** Dashboard → Reports (CPU/memoria/conexiones) — el
  vigilante toma captura al finalizar el registro masivo y al terminar el evento.

---

## 6. Contactos y accesos a tener a la mano (2 de octubre)

- [ ] Usuario/pass del dashboard de Supabase
- [ ] Usuario/pass de Vercel
- [ ] DB password de producción (para pg_dump)
- [ ] Usuario admin de la app (login web)
- [ ] Impreso: hoja de control de premios (modo degradado)
- [ ] Respaldos: ruleta física / tómbola manual
