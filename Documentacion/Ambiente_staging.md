# Ambiente Staging — Bingo La Rioja

**Propósito:** réplica del ambiente público de producción para probar features
y cambios sin tocar datos ni usuarios reales.

**Configuración elegida:** Supabase plan Free + copia completa de datos de
producción + preview de Vercel con rama `staging`.

```
producción:  main → la-rioja.vercel.app                  → Supabase wfkqsifhxnarmxrvbgiu
staging:     staging → la-rioja-git-staging-*.vercel.app → Supabase <ref-staging>
```

---

## 1. Crear el proyecto Supabase (manual, dashboard)

1. supabase.com/dashboard → **New project** → misma organización
   (`eescalante58's Org`).
2. Nombre: `bingo-larioja-staging`. **Misma región** que producción.
   Guardar el DB password.
3. En el proyecto nuevo → **Settings → API Keys** → anotar:
   - `URL` → `https://<ref-staging>.supabase.co`
   - `publishable / anon key`
   - `service_role key`

> ⚠️ Plan Free: se pausa tras ~7 días sin uso (reactivar con un clic).
> Su compute/pooler es menor que prod — válido para features, NO para
> certificar carga. Para paridad de rendimiento se requeriría Pro + Small.

---

## 2. Clonar esquema + datos (pg_dump / pg_restore)

Requisito: `pg_dump` instalado localmente (herramientas de PostgreSQL 17).

```powershell
# 1. Dump completo del esquema public de producción
pg_dump "postgresql://postgres:PASS_PROD@db.wfkqsifhxnarmxrvbgiu.supabase.co:5432/postgres" `
  --schema=public --format=custom --file=full_prod.dump

# 2. Restaurar en staging
pg_restore "postgresql://postgres:PASS_STAGING@db.<ref-staging>.supabase.co:5432/postgres" `
  --schema=public --no-owner --no-privileges full_prod.dump
```

Notas:
- Si la conexión directa falla (IPv6), usar la cadena **Session pooler**
  (Dashboard → Connect), puerto 5432, usuario `postgres.<ref>`.
- Errores benignos esperados en restore: `extension already exists`,
  `publication supabase_realtime already exists` — staging ya trae esos
  objetos; las tablas y datos se restauran de todas formas.
- `PASS_PROD` / `PASS_STAGING` son los **DB passwords** (no las API keys).
  Se gestionan en Dashboard → Settings → Database.

---

## 3. Usuarios admin en staging

El dump de `public` **no incluye `auth.users`** (esquema gestionado).
`user_companies`, `invoices.sold_by`, etc. referencian UUIDs de auth.

**Opción A — copiar auth.users (recomendada, preserva IDs y FKs):**
el password bcrypt es portable → el admin entra con su misma clave.

```sql
-- 1) En producción (SQL Editor): exportar
SELECT * FROM auth.users;

-- 2) En staging (SQL Editor): INSERT INTO auth.users con los mismos ids
--    (generar los INSERTs a partir del resultado anterior)
```

**Opción B — recrear manual:** staging → Authentication → Add user →
crear el admin con su email → remapear `user_companies.user_id` al nuevo
UUID si difiere.

---

## 4. Vercel — rama staging + env vars Preview

```powershell
git checkout -b staging
git push -u origin staging
```

Vercel → proyecto `la-rioja` → **Settings → Environment Variables** →
duplicar estas con scope **Preview** (desmarcar Production/Development):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref-staging>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | anon/publishable key staging |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key staging |

> Importante: usar el nombre **`SUPABASE_SERVICE_ROLE_KEY`** SIN prefijo
> `NEXT_PUBLIC_` — el código ya lo soporta (`createAdminClient` hace
> fallback) y corrige la exposición pública marcada en la auditoría.

Cada push a `staging` → preview automático
(`la-rioja-git-staging-*.vercel.app`) contra la BD de staging.

---

## 5. Verificación

```sql
-- Conteos iguales entre prod y staging (SQL Editor de cada proyecto):
SELECT (SELECT COUNT(*) FROM events)        AS events,
       (SELECT COUNT(*) FROM cards)         AS cards,
       (SELECT COUNT(*) FROM invoices)      AS invoices,
       (SELECT COUNT(*) FROM wheel_configs) AS wheels;
```

Checklist:
- [ ] Preview URL carga sin errores
- [ ] Login con el usuario admin recreado/copiado
- [ ] `/admin/bingo` muestra eventos y cartones
- [ ] `/registro` funciona contra staging

---

## 6. Uso continuo

- **Migraciones nuevas**: replicar a staging con
  `supabase link --project-ref <ref-staging>` + `supabase db push`
  (el orden quedó corregido: `20261007000002` va después de la tabla).
- **Pruebas de carga en staging**: los scripts de `loadtest/` aceptan
  env file propio:
  ```powershell
  node --env-file=.env.staging loadtest/seed.mjs
  node --env-file=.env.staging loadtest/load-test.mjs --wheel <id>
  ```
  Crear `.env.staging` local (no commitear) con las vars del proyecto staging.

---

## 7. Advertencias

1. **PII duplicada**: copia completa incluye teléfonos/facturas reales.
   Mantener el proyecto sin colaboradores extra; considerar borrarlo
   después del ciclo del evento.
2. **No usar staging para certificar capacidad**: el plan Free no refleja
   el compute/pooler de producción. Los números de
   `Documentacion/Prueba_carga_registro.md` siguen siendo la referencia
   válida (medidos en prod).
3. **Nunca apuntar prod a staging ni viceversa**: verificar siempre el
   `<ref>` de la URL antes de correr dumps o seeds.
