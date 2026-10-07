# Manual Técnico de la Aplicación

**Nombre del Proyecto:** La Rioja — Sitio Institucional + Gestión de Bingo (Bingo La Rioja 2026)
**Versión del Documento:** 1.0.0
**Fecha de última actualización:** Octubre 2026
**Autores / Equipo de Ingeniería:** Equipo de desarrollo La Rioja (Devin/Cognition)

---

## 1. Visión General del Sistema

### 1.1 Propósito y Alcance

Aplicación web para **La Rioja — Centro de Formación Laboral** que integra dos dominios:

1. **Sitio institucional público** (CMS administrable): home, about, programas, contacto, FAQ, galería del evento.
2. **Módulo de Bingo** (backoffice + operación en vivo): gestión de eventos, inventario de cartones, ventas y facturación, asignación de cartones a alumnos, mensajes promocionales por WhatsApp, sorteos con ruleta y tómbola (incluye **registro público de cartones** para hasta ~1,200 asistentes), monitor de ganadores y dashboard ejecutivo en tiempo real.

Público objetivo: público general, asistentes al evento en vivo, equipo de comunicación (CMS), vendedores/caja y administradores del bingo.

### 1.2 Stack Tecnológico

- **Framework:** Next.js 16.2.7 (App Router, Turbopack) — React 19 + TypeScript 5
- **Frontend:** Server Components + Client Components; Tailwind CSS 3.4; Tremor React 3.18 (dashboards/tablas); Radix UI; lucide-react (iconos); next-themes (dark mode); ECharts (gráficas); @dnd-kit (drag & drop CMS)
- **Backend:** Route Handlers (`src/app/api/**`) + Server Actions (`"use server"`) + dispatcher `POST /api/actions`; funciones compartidas en `*-core.ts`; Supabase JS SDK (`@supabase/ssr` + `supabase-js`)
- **Base de datos:** PostgreSQL 17 sobre Supabase — RLS, triggers, funciones SECURITY DEFINER, vistas, enums
- **Auth:** Supabase Auth (email/password + OAuth Google) con selección de empresa por sesión
- **Storage:** Supabase Storage (5 buckets públicos)
- **Reportes:** jsPDF + jspdf-autotable (PDF/CSV en cliente)
- **Integraciones:** UltraMsg (envío WhatsApp), Resend (emails), wa.me links
- **Testing:** Playwright (`test:responsiveness`)
- **Despliegue:** Vercel (`lariojacflsv.site`), despliegue automático desde `main`

### 1.3 Diagrama de Arquitectura

```
+------------------------------------------------------------------+
|                    Next.js 16 (App Router)                       |
|  Server Components (SSR inicial)   Client Components (React 19)  |
|  +--------------------------+   +-----------------------------+|
|  | Server Actions           |   | fetch('/api/...') → JSON    ||
|  | (*-core.ts, SSR/auth)    |   | RealtimeDashboardWrapper    ||
|  +--------------------------+   +-----------------------------+|
|  +-----------------------------------------------------------+ |
|  |              Route Handlers  /api/**  (JSON)              | |
|  |  checkAdmin(companyId) → *-core.ts → Supabase             | |
|  +-----------------------------------------------------------+ |
+----------------------------+-------------------------------------+
                             | HTTPS / WSS (Realtime)
                             v
+------------------------------------------------------------------+
|                        Supabase PaaS                             |
|  +----------------+  +-----------------+  +--------------------+ |
|  | Supabase Auth  |  | Storage (5      |  | PostgreSQL +       | |
|  | (JWT, OAuth)   |  | buckets públicos)|  | PostgREST/Realtime | |
|  +----------------+  +-----------------+  | - RLS por empresa  | |
|                                           | - Triggers/enums   | |
|                                           | - Funciones        | |
|                                           |   SECURITY DEFINER | |
|                                           +--------------------+ |
+------------------------------------------------------------------+
|  Integraciones externas: UltraMsg API (WhatsApp), Resend (email) |
+------------------------------------------------------------------+
```

**Regla arquitectónica clave** (`.devin/rules/no-rerender-completo.md`): las operaciones disparadas desde client components en páginas admin/en vivo **deben** usar Route Handlers que respondan JSON; está prohibido invocar Server Actions desde el cliente (gatilla un re-render RSC completo) o usar `router.refresh()`.

---

## 2. Configuración del Entorno Local

### 2.1 Requisitos Previos

- Node.js `>= 18.x`, npm `>= 9.x`
- Supabase CLI (opcional, para aplicar migraciones)
- Acceso al proyecto Supabase `wfkqsifhxnarmxrvbgiu` (Bingo La Rioja 2026)

### 2.2 Variables de Entorno (`.env.local`)

| Variable | Tipo | Descripción |
| :------- | :--- | :---------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública (safe) | Llave publishable, sujeta a RLS |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Bypass RLS; solo servidor (Route Handlers/core) |
| `NEXT_PUBLIC_SITE_URL` | Pública | URL base del sitio (emails, enlaces) |
| `ULTRAMSG_INSTANCE_ID` / `ULTRAMSG_TOKEN` | Secretas | API UltraMsg para envío de WhatsApp |
| `RESEND_API_KEY` | Secreta | Envío de correos transaccionales |
| `VERCEL_OIDC_TOKEN` | Interna | Autenticación de Vercel |

> **Advertencia:** la `SERVICE_ROLE_KEY` evade RLS por completo. Solo se usa en servidor (cliente admin en `src/lib/supabase/server.ts`); nunca en componentes de cliente.

### 2.3 Instrucciones de Arranque

```bash
git clone https://github.com/eescalante58/La-Rioja.git
cd LaRioja
npm install
npm run dev          # http://localhost:3000

# Verificación típica tras cambios
npx tsc --noEmit     # typecheck
npm run build        # build de producción (47 rutas)
npm run test:responsiveness   # Playwright
```

Las migraciones SQL viven en `supabase/migrations/*.sql` y se aplican manualmente en el SQL Editor de Supabase o con `supabase db push`. **Nota:** los `ALTER TYPE ... ADD VALUE` deben ejecutarse fuera de transacción.

---

## 3. Estructura del Proyecto

```
LaRioja/
├── supabase/migrations/        # Migraciones SQL versionadas (baseline en BD)
├── loadtest/                   # Scripts de prueba de carga (seed, combined-test)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Home pública         ├── about, programs, contact, faq
│   │   ├── bingo/              # Galería pública del evento
│   │   ├── registro/           # Registro público de cartones (asistentes)
│   │   ├── ruleta/             # Ruleta pública proyectable
│   │   ├── tombola/ + tombola/monitor/  # Tómbola pública + monitor staff
│   │   ├── login/, auth/       # Login, callback OAuth, select-company, reset
│   │   ├── admin/              # Backoffice (ver §7)
│   │   │   ├── page.tsx        #   Dashboard ejecutivo (Realtime)
│   │   │   ├── bingo/          #   Gestión Bingo (5 pestañas)
│   │   │   ├── cms/            #   Gestor CMS + editor por página
│   │   │   ├── settings/       #   9 opciones de configuración
│   │   │   ├── dashboard-core.ts  #   Lógica de datos del dashboard
│   │   │   └── bingo/*-core.ts    #   Lógica de facturas/WhatsApp compartida
│   │   └── api/                #   Route Handlers JSON (ver §7.8)
│   ├── components/
│   │   ├── admin/              # Dashboard: charts, reportes, drill-downs
│   │   ├── admin/bingo/        # 20 diálogos/pestañas del módulo bingo
│   │   ├── admin/cms/, admin/faq/, admin/users/
│   │   ├── registration/       # Formulario público de registro
│   │   ├── tombola/, wheel/    # Tómbola y rueda de la fortuna (canvas)
│   │   ├── gallery/, layout/, ui/
│   └── lib/
│       ├── supabase/           # client.ts (browser) / server.ts (service role)
│       ├── auth/               # authorization.ts, guards.ts (withRole)
│       ├── action-client.ts    # callAction/callActionForm → /api/actions
│       └── validation/         # Esquemas zod por dominio
└── .devin/rules/               # Reglas del repo (JSDoc, no-rerender)
```

---

## 4. Base de Datos (PostgreSQL / Supabase)

**Esquema:** `public`, multi-empresa (tenant por `company_id`). RLS habilitado en todas las tablas sensibles; el acceso público se acota a lecturas de contenido publicado/ruletas publicadas y a la función `register_participant_cards`.

### 4.1 Enums

| Enum | Valores | Uso |
| :--- | :------ | :-- |
| `card_status_enum` | `Disponible`, `Asignado`, `Vendido`, `Cancelado`, `Donado`, `Reservado`, `Anulado` | Estado del cartón (`cards.card_status`) |
| `card_type_enum` | `Fisico`, `Virtual` | Tipo de cartón (`cards.card_type`) |
| `invoice_payment_method_enum` | `efectivo`, `tarjeta credito`, `tarjeta debito`, `transferencia` | `invoices.payment_method` |
| `invoice_status_enum` | `pagada`, `pendiente`, `anulada`, `Donada` | `invoices.status` |
| `student_level_enum` | `1.Terapeutico`, `2.Inicial`, `3.Medio`, `4.Prelaboral`, `5.Laboral`, `6.Personal La Rioja` | Nivel del alumno |
| `site_page_type` | `home`, `about`, `contact`, `global`, `social media`, `whatsapp message`, `tombola` | Páginas administrables del CMS |

**CHECK constraints tipo enum (no son TYPE):**

- `wheel_configs.mode` / `wheel_items.mode` / `wheel_spins.mode` / `wheel_participating_cards.mode`: `'Premios' | 'Cartones' | 'Participantes'`
- `wheels_presents_cards.mode`: solo `'Participantes'`
- `registration_limits.mode`: `'normal' | 'evento'` (valores anti-abuso: normal 10/min·40 día·30 teléfono; evento 500/min·15000 día·30 teléfono)

### 4.2 Tablas

**Dominio multi-tenant / seguridad**

| Tabla | Descripción | PK / Constraints clave |
| :---- | :---------- | :--------------------- |
| `companies` | Empresas organizadoras (tenants); incluye `def_dash_event_id` (evento activo del dashboard) | PK `company_id` |
| `users` | Perfil extendido de `auth.users` (nombre, email, rol principal, avatar, `last_login`) | PK `id` (uuid → auth.users) |
| `roles` | Catálogo de roles con jerarquía `level` | PK `role_id` |
| `user_companies` | Membresía usuario↔empresa con rol por empresa (base del filtrado RLS) | PK compuesta (user_id, company_id) |
| `user_activity_log` | Bitácora de auditoría (acción, entidad, metadata jsonb) | Inserción propia; lectura propia o admin/reader global |
| `country_codes` | Prefijos telefónicos por país (iso2, iso3, phone_code, flag_emoji) | UNIQUE iso2/iso3 |

**Dominio Bingo**

| Tabla | Descripción | PK / Constraints clave |
| :---- | :---------- | :--------------------- |
| `events` | Eventos de bingo por empresa (nombre, fecha, meta `event_goal`, `card_price`, `is_active`) | UNIQUE (company_id, event_id) |
| `cards` | Inventario de cartones (número, tipo, estado, precios, factura asociada, datos del jugador, `sold_by`, `image_url`) | UNIQUE (company_id, event_id, card_number); CHECK precio ≥ 0; `Vendido` exige `invoice_number`+`sales_price` |
| `invoices` | Facturas de venta (cliente, WhatsApp, gestor `manager_name`, método, `cards_number`, `card_price`, `total_amount`, `status`) | PK compuesta (company_id, invoice_number); CHECK total = cartones × precio |
| `students` | Alumnos por evento (nombre, `student_level`) | UNIQUE (company_id, event_id, student_id) |
| `students_cards` | Asignación cartón↔alumno (conduce la columna "Jugador" y el desglose por nivel) | UNIQUE por evento; cascadas |
| `customer_phone_number` | Directorio de teléfonos de clientes (`phone_number`, `table_data_source`) | — |
| `whatsapp_promo_logs` | Bitácora de envíos promocionales masivos | — |

**Dominio CMS / sitio público**

| Tabla | Descripción | Constraints |
| :---- | :---------- | :---------- |
| `site_content` | Secciones administrables por página (`page`, `section_key`, título, imagen, orden, `is_active`, metadata) | UNIQUE (page, section_key); lectura pública si `is_active` |
| `faqs` / `faq_sections` | Preguntas frecuentes agrupadas en secciones | — |
| `contact_submissions` | Mensajes del formulario de contacto | — |
| `event_gallery` | Fotos de la galería pública del evento (`image_url`, `content_order`) | — |

**Dominio sorteos (ruleta y tómbola)**

| Tabla | Descripción | Constraints |
| :---- | :---------- | :---------- |
| `wheel_configs` | Cabecera de cada ruleta/tómbola (mode, `wheel_name`, `published`, `time_rotation`, `is_automatic_rotation`, `automatic_timeout_rotation`, `prizes_number`) | UNIQUE (company_id, event_id, mode, wheel_name); FK→events |
| `wheel_items` | Segmentos de la ruleta (label, color, `quantity` = stock de premio, `is_prize`, `position`) | FK→wheel_configs CASCADE |
| `wheel_spins` | Auditoría de giros (`winner_label`, `card_number`, `prize_label`, `spun_by`, `verification_hash`) | FK→wheel_configs CASCADE |
| `wheel_participating_cards` | Cartones vendidos/donados cargados a una tómbola (modos Cartones/Participantes) con resultado del ganador (`is_winner`, `winner_order`, datos del ganador, `observation`) | UNIQUE (company_id, event_id, wheel_id, card_number); FK compuesta→cards |
| `wheels_presents_cards` | Cartones auto-registrados por asistentes desde `/registro` (nombre, teléfono, `registered_ip`, resultado del ganador) | UNIQUE (company_id, event_id, card_number); FK→cards |
| `registration_attempts` | Log de intentos de registro por IP (ventana anti-ráfaga) | Sin políticas RLS: solo accesible vía función |
| `registration_limits` | Config anti-abuso del registro público — **fila única** `id=1` (modo normal/evento, intentos/minuto, cartones/día por IP, cartones por teléfono) | CHECK `id = 1`; lectura autenticados; escritura solo admin |

### 4.3 Índices

**Índices estructurales (baseline):**

- `cards`: UNIQUE `(company_id, event_id, card_number)` — cubre el inventario completo (equality + ORDER BY card_number) y los range checks de "Verificar".
- `invoices`: PK `(company_id, invoice_number)`.
- `events`: UNIQUE `(company_id, event_id)` — referenciado por todas las FK compuestas.

**Índices de rendimiento (migraciones):**

| Índice | Tabla | Columnas | Propósito |
| :----- | :---- | :------- | :-------- |
| `idx_invoices_company_event_date` | invoices | (company_id, event_id, invoice_date DESC) | Lista de facturas del evento por fecha |
| `idx_invoices_company_event_number` | invoices | (company_id, event_id, invoice_number) | Duplicados y correlativo `FactAut-%` |
| `idx_invoices_company_event_created_at` | invoices | (company_id, event_id, created_at DESC) | Orden real "más reciente primero" |
| `idx_wheel_items_wheel` / `idx_wheel_items_event_mode` | wheel_items | wheel_id / (company_id, event_id, mode, wheel_name) | Segmentos por ruleta y por evento |
| `idx_wheel_spins_wheel` / `idx_wheel_spins_event_mode` | wheel_spins | wheel_id / (company_id, event_id, mode, wheel_name) | Historial de giros |
| `idx_wheel_part_wheel` / `idx_wheel_part_winners` / `idx_wheel_part_registered` | wheel_participating_cards | wheel_id (parciales `WHERE is_winner`) | Participantes pendientes, galería de ganadores, orden de captura |
| `idx_wheels_presents_wheel` / `idx_wheels_presents_winners` / `idx_wheels_presents_registered` | wheels_presents_cards | wheel_id (parciales `WHERE is_winner`) | Idem para registro público |
| `idx_registration_attempts_ip_time` | registration_attempts | (client_ip, attempted_at DESC) | Ventana anti-ráfaga por IP |
| `uq_wheel_participating` | wheel_participating_cards | (company_id, event_id, wheel_id, card_number) | Un cartón = una vez por tómbola |
| `uq_wheels_presents` | wheels_presents_cards | (company_id, event_id, card_number) | Un cartón = un registro por evento |
| `uq_wheel_config` | wheel_configs | (company_id, event_id, mode, wheel_name) | Nombre único de ruleta por evento |

### 4.4 Vistas

| Vista | Propósito |
| :---- | :-------- |
| `v_students_with_counts` | Alumnos con conteo de cartones asignados (LEFT JOIN students_cards) — alimenta "Asignación por Nivel" |
| `v_sold_by` | Agregado de ventas por vendedor — "Ventas por Gestor" |
| `v_promo_batch_summary` | Resumen de lotes de envíos promocionales WhatsApp |

### 4.5 Funciones / Stored Procedures

**Seguridad (SECURITY DEFINER, usadas en políticas RLS):**

| Función | Propósito |
| :------ | :-------- |
| `is_admin_global()` / `is_global_admin()` | true si el usuario es admin global |
| `is_reader_global()` / `is_global_role(text)` | true para reader global / rol global arbitrario |
| `role_id_by_name(text)` | Resuelve rol por nombre (sincronización role↔role_id) |

**Negocio:**

| Función | Propósito |
| :------ | :-------- |
| `set_timestamps()` | Trigger genérico `updated_at = now()` (reutilizado en todas las tablas) |
| `sync_user_companies_role()` | Mantiene consistente `role`↔`role_id` en user_companies |
| `log_user_activity(...)` | Inserta en la bitácora `user_activity_log` |

**Sorteos (tómbola / ruleta):**

| Función | Propósito |
| :------ | :-------- |
| `participant_card_status(company_id, event_id, card_number)` | Helper: devuelve `no_existe`/`no_vendido`/`ya_registrado` o NULL si el cartón es válido para registro |
| `register_participant_cards(wheel_id, player_name, player_phone, card_numbers[])` → jsonb | **Única puerta de escritura pública** del registro de asistentes. SECURITY DEFINER + `search_path` fijo. Transacción "todo o nada": valida ruleta publicada en modo Participantes, aplica límites de `registration_limits` (ráfaga por IP en `registration_attempts`, tope diario por IP y por teléfono), marca cada cartón inválido con su motivo, y el UNIQUE serializa carreras entre dos asistentes |
| `enforce_wheel_spin_prize_limit()` | Trigger BEFORE INSERT en wheel_spins: bloqueo `FOR UPDATE` de wheel_configs serializa giros concurrentes; impide superar `prizes_number` |
| `enforce_tombola_prize_limit()` / `enforce_presents_prize_limit()` | Ídem al marcar `is_winner` en wheel_participating_cards / wheels_presents_cards |
| `set_winner_order()` / `set_winner_order_presents()` | Asigna `winner_order` incremental al ganar (o lo libera al desmarcar) |
| `prevent_winner_reentry()` | Trigger BEFORE INSERT en wheel_participating_cards: un cartón que ya ganó en una tómbola del evento no puede entrar a otra ronda |

**Administración / introspección (usadas por `/admin/settings/security` y `/api/search`):**

| Función | Propósito |
| :------ | :-------- |
| `busqueda_universal(p_company_id, p_event_id, p_termino)` | Buscador global del dashboard (facturas, cartones, alumnos, participantes) |
| `get_table_policies(t_name)` / `get_tables_rls_status()` / `get_views_status()` / `check_security_definer_views()` | Introspección de políticas RLS, estado de RLS por tabla, vistas y vistas SECURITY DEFINER (panel de auditoría de seguridad) |

### 4.6 Triggers

| Trigger | Tabla | Propósito |
| :------ | :---- | :-------- |
| `trg_*_set_timestamps` | Todas las tablas de negocio | `updated_at` automático vía `set_timestamps()` |
| `trg_cards_validate_invoice_event` | cards | Coherencia factura↔evento |
| `trg_user_companies_sync_role` | user_companies | Sincroniza rol textual ↔ role_id |
| `trg_wheel_spins_prize_limit` | wheel_spins | Límite de premios por ruleta (serializa con FOR UPDATE) |
| `trg_wheel_participating_prize_limit` / `trg_wheels_presents_prize_limit` | tablas de participantes | Límite de ganadores por tómbola |
| `trg_wheel_part_winner_order` / `trg_wheels_presents_winner_order` | idem | Consecutivo `winner_order` |
| `trg_prevent_winner_reentry` | wheel_participating_cards | Garantía BD anti re-ingreso de ganadores entre rondas |

### 4.7 Buckets de Supabase Storage

| Bucket | Contenido | Acceso |
| :----- | :-------- | :----- |
| `cards_images` | Imágenes/PDF de cartones generados | Público (URL pública para WhatsApp) |
| `invoices_images` | Comprobantes/imágenes de facturas | Público (se adjuntan al mensaje wa.me) |
| `cms_images` | Assets del CMS (incluye videos promo `promos/`) | Público |
| `event_gallery_images` | Fotos de la galería del evento | Público |
| `user_avatar` | Avatares de usuarios | Público |

### 4.8 Políticas RLS (patrones)

- **Lectura pública (rol `anon`):** `site_content` con `is_active=true`, `wheel_configs`/`wheel_items`/`wheel_participating_cards`/`wheels_presents_cards` de ruletas `published=true`.
- **Escritura por empresa:** `EXISTS` en `user_companies` con rol `admin_empresa`/`ventas`, o `is_admin_global()`.
- **Sin acceso directo:** `registration_attempts` (RLS sin políticas — solo la función SECURITY DEFINER); `wheels_presents_cards` INSERT solo vía `register_participant_cards`.
- **Config:** `registration_limits` lectura autenticada, escritura `admin_empresa`+.

---

## 5. Autenticación y Control de Acceso

### 5.1 Flujo

1. Login en `/login` (email/password con validación de complejidad, u OAuth Google → `/auth/callback`).
2. Tras autenticarse, `/auth/select-company` fija la empresa de trabajo para toda la sesión (cookie de sesión vía `/api/auth/session-config`).
3. Middleware (`ƒ Proxy`) protege rutas `/admin/*`; páginas usan `requireRoleLevel(minLevel)` en servidor.
4. Route Handlers `/api/bingo/*` y `/api/dashboard` validan con `checkAdmin(companyId, minLevel=4)` = autenticación + nivel de rol + membresía de empresa (`requireCompanyAccess`).

### 5.2 Roles y niveles

| Rol | Ámbito | Acceso típico |
| :-- | :----- | :------------ |
| `admin` (global) | Sistema | Todo, incluido CRUD de roles y auditoría |
| `admin_empresa` | Empresa | CMS, bingo completo, configuración |
| `ventas` | Empresa | Ventas/facturación, inventario, sorteos |
| `reader` | Global | Dashboard solo lectura |

Niveles de referencia en `src/lib/auth/authorization.ts`: SuperAdmin 10, Admin 8, Editor 6, Operator 4 (`checkAdmin` exige ≥4 por defecto).

### 5.3 Patrones de guard

- **Server Actions:** `withRole(minLevel, action)` envuelve la acción.
- **Route Handlers:** `checkAdmin(companyId)` → 401/403 JSON.
- **Dispatcher:** `POST /api/actions` con `REGISTRY` whitelist (`"dominio.accion"`), invocable desde clientes con `callAction`/`callActionForm` (`src/lib/action-client.ts`).

---

## 6. Despliegue y CI/CD

- **Hosting:** Vercel — push a `main` dispara build+deploy automático (`lariojacflsv.site`).
- **Verificación pre-commit habitual:** `npx tsc --noEmit` + `npm run build` (47 rutas generadas).
- **Migraciones:** manuales vía SQL Editor o `supabase db push` (ver §2.3).
- **Entornos:** producción y staging documentados en `Documentacion/Ambiente_staging.md`; plan de rollback en `Plan_Rollback.md`.
- **Pruebas de carga:** `loadtest/` (seed de 5,000 cartones, prueba combinada registro+tómbola, probe XFF, scripts SQL de límites).

---

## 7. Componentes Funcionales por Opción de la Aplicación

### 7.1 Sitio público

| Ruta | Función | Componentes / datos |
| :--- | :------ | :------------------ |
| `/` | Home institucional | `ParallaxHero`, `ScrollReveal`, secciones CMS (`site_content` page=home), `Navbar`, `Footer`, `FloatingContact`, `WhatsAppFab` |
| `/about` | Quiénes somos | Secciones CMS (page=about), misión/visión/organización |
| `/programs` | Oferta formativa | Tarjetas de programas, `ProgramCTA` |
| `/contact` | Contacto | `ContactModal`, formulario → `contact_submissions` (Server Action `contact.ts`) |
| `/faq` | Preguntas frecuentes | `faqs` + `faq_sections`, accordion |
| `/bingo` | **Galería pública del evento** | `GalleryGrid`, `GalleryHeader`, `EventInfoBanner`, `PromoVideoCard`, `ShareButton`, `SlideshowButton`; datos de `event_gallery` + bucket `event_gallery_images` |
| `/login` | Acceso | Email/password + OAuth Google; `PasswordRequirements`; recuperación (`/auth/forgot-password`, `/auth/reset-password`) |

### 7.2 Operación en vivo del evento

| Ruta | Función | Componentes / backend |
| :--- | :------ | :-------------------- |
| `/registro` | **Registro público de cartones** (hasta ~1,200 asistentes) | `ParticipantRegistrationForm`: el asistente ingresa nombre, teléfono y números de cartón → `rpc register_participant_cards` (transacción atómica, anti-abuso por IP/teléfono, motivo de rechazo por cartón) |
| `/ruleta` | Ruleta pública proyectable | `WheelOfFortune` (canvas): lee `wheel_configs`/`wheel_items` publicadas vía Realtime; giros manuales o automáticos (`is_automatic_rotation`, `automatic_timeout_rotation`); premios con stock (`quantity`, `is_prize`) |
| `/tombola` | Tómbola pública (sorteo de cartones/participantes) | `Tombola`: gira sobre `wheel_participating_cards` (vendidos) o `wheels_presents_cards` (registrados); duración `time_rotation` |
| `/tombola/monitor` | Monitor de ganadores (staff) | `TombolaMonitor`: bandeja de ganadores en tiempo real, captura de datos del ganador (nombre, documento, teléfono, premio, observación) |

### 7.3 `/admin` — Dashboard ejecutivo (Realtime)

`RealtimeDashboardWrapper` (client) + `dashboard-core.ts` + `GET /api/dashboard?view=...` + suscripción Supabase Realtime con debounce (`reportedDelta`).

- **KPIs y gráficas:** meta vs vendido (`SalesProgressChart`), ventas por día (`DailySalesChart`), ventas anuales (`YearlySalesChart`).
- **Buscador universal** → `rpc busqueda_universal` (facturas, cartones, alumnos).
- **Drill-downs apilados (modales):**
  - "Ventas del Día" → resumen **por vendedor expandible** (+/−) → métodos de pago → facturas → "Consulta de Factura" (`NewInvoiceDialog` readOnly apilado, retorno al modal de día).
  - "Asignación de Cartones por Nivel" → nivel → alumno → cartones asignados (join `students_cards→students`).
  - "Ventas por Gestor", "Clientes con más Cartones", resumen por tipo/precio de cartón, "No Vendidos" (`UnsoldCardsReportDialog`), cartones reportados/registrados.
- **Actividad reciente** vía `user_activity_log`.

### 7.4 `/admin/bingo` — Gestión Bingo (5 pestañas)

`BingoManagerClient` con pestañas cargadas dinámicamente (`next/dynamic`); la pestaña activa persiste en `sessionStorage`.

| Pestaña | Componente | Funciones |
| :------ | :--------- | :-------- |
| **Eventos** | `EventsTab`, `EventDialog`, `GenerateCardsDialog`, `UploadCardsDialog` | CRUD de eventos; generación de lotes de cartones (rango + tipo + precio) con imágenes a `cards_images`; carga masiva desde archivo |
| **Inventario de Cartones** | `InventoryTab`, `InventoryDialogs`, `InventoryDetailsDialog`, `EditCardDialog`, `ReassignCardDialog`, `RangeReassignDialog`, `RangePlayerReassignDialog`, `CardStatusReportDialog` | Inventario paginado (100/pág, cache por evento, encabezado sticky); edición por cartón; reasignación de tipo/jugador por rango; **Informe por Estado** (CSV/PDF, alumnos en Asignados) |
| **Ventas y Facturación** | `SalesTab`, `NewInvoicePlusDialog` (creación), `NewInvoiceDialog` (edición/consulta), `InvoiceDetailsDialog`, `InvoiceDateReportDialog`, `WhatsAppPopup` | Lista de facturas del evento; **Nueva Factura Plus** (correlativo `FactAut-`, verificación de rango, grid de asociación de cartones, acceso al inventario como overlay); envío de factura+cartones por WhatsApp (wa.me + `invoices_images`); **Informe por Fecha** (selector de fechas disponibles, CSV/PDF/preview, totales por método de pago) |
| **Mensajes Promocionales** | `PromotionalTab` | Envío masivo UltraMsg a `customer_phone_number`, bitácora en `whatsapp_promo_logs`, resumen `v_promo_batch_summary` |
| **Sorteos/Juegos** | `WheelTab`, `WheelConfigDialog`, `WheelItemsDialog` | CRUD de ruletas/tómbolas (nombre, modo Premios/Cartones/Participantes, `time_rotation`, giro automático, `prizes_number`, publicación); edición de segmentos con stock y color; carga masiva de cartones a tómbola (`/api/tombola/cards` excluye ganadores previos) |

Sub-página `/admin/bingo/manual`: manual de usuario embebido.

### 7.5 `/admin/cms` — Gestión de contenido

`CMSManagerClient`, `CMSTable`, `CMSFilters`, `CMSCreateDialog`, `CMSEditForm` (`/admin/cms/[id]`), `CMSViewDialog`, `CMSDeleteDialog`, `GalleryManagement`, `FAQManager`/`FAQTable`/`FAQSectionTable`.

- CRUD de secciones `site_content` por página (home, about, contact, global, social media, whatsapp message, tombola), con orden de presentación, activación e imágenes a `cms_images`.
- Gestión de la galería del evento (`event_gallery` + bucket `event_gallery_images`).
- CRUD de FAQs y secciones de FAQ.

### 7.6 `/admin/settings` — Configuración (9 opciones)

| Opción | Ruta | Función |
| :----- | :--- | :------ |
| Códigos de Países | `/admin/settings/countries` | CRUD + importación de `country_codes` |
| Usuarios y Roles | `/admin/settings/users` | `UserTable`, `CreateUserDialog`, `UserDialog`, `RoleTable`, `RoleDialog`, `UserCompaniesDialog` (asignación usuario-empresa-rol) |
| Empresas | `/admin/settings/companies` | CRUD de `companies` y evento por defecto del dashboard |
| Alumnos | `/admin/settings/students` | CRUD `students` + `students_cards` (asignación de cartones por nivel) |
| Seguridad | `/admin/settings/security` | Auditoría RLS: `get_tables_rls_status`, `get_table_policies`, `get_views_status`, `check_security_definer_views` |
| Auditoría | `/admin/settings/logs` | Visor de `user_activity_log` (rol ≥8) |
| Límites de Registro | `/admin/settings/registration-limits` | Edita la fila única `registration_limits` (modo normal/evento) |
| Mensajes de Contacto | `/admin/settings/contact` | Bandeja de `contact_submissions` |
| Datos de Prueba | `/admin/settings/test-data` | Generación/limpieza de datos de respaldo |

Otras páginas admin: `/admin/profile` (perfil propio + avatar `user_avatar`) y `/admin/manual` (manual de usuario).

### 7.7 API — Route Handlers JSON (`src/app/api/`)

| Endpoint | Método | Función |
| :------- | :----- | :------ |
| `/api/actions` | POST | Dispatcher whitelist `REGISTRY` para Server Actions de baja frecuencia (`callAction`/`callActionForm`) |
| `/api/auth/session-config` | POST | Fija empresa activa en la sesión |
| `/api/bingo/cards` | GET/POST/PUT/DELETE | Inventario: listado paginado paralelo (SELECT explícito + embed `students_cards→students`), alta, edición, reasignaciones |
| `/api/bingo/cards/check-range` | GET | Verificación de rangos de cartones disponibles |
| `/api/bingo/cards/report` | GET | Datos del informe de cartones por estado |
| `/api/bingo/invoices` | GET/PUT/DELETE | Facturas del evento, edición, anulación |
| `/api/bingo/invoices/next-number` | GET | Correlativo de factura (`FactAut-%`) |
| `/api/bingo/invoices/daily-totals` | GET | Totales de venta por día |
| `/api/bingo/sellers` | GET | Vendedores disponibles |
| `/api/bingo/whatsapp` | POST | Envío de factura/cartones por WhatsApp |
| `/api/dashboard` | GET | Vistas del dashboard: `sales-summary-by-date`, `invoices-by-date-group`, `sales-by-manager`, `invoices-by-manager`, `invoices-by-customer`, `invoice-cards`, `assignment-by-level`, `invoices-by-date`, etc. |
| `/api/invoice` | GET | Consulta puntual de factura por número |
| `/api/search` | GET | Buscador universal → `rpc busqueda_universal` |
| `/api/tombola/cards` | POST | Carga masiva de cartones vendidos/donados a la tómbola (excluye ganadores previos) |
| `/api/tombola/spin` | POST | Giro atómico de tómbola: selecciona ganador y marca `is_winner` en la misma transacción |
| `/api/tombola/state` | GET | Estado en vivo de la tómbola (página pública + monitor) |
| `/api/tombola/winners` | GET/PUT | Bandeja de ganadores y captura de datos del ganador |
| `/api/wheel/spin` | POST | Registro de giro de ruleta (`wheel_spins`) con límite de premios |

Todos los handlers de `/api/bingo/*` y `/api/dashboard` ejecutan `checkAdmin(companyId)` (rol ≥4 + membresía de empresa) antes de tocar datos.

### 7.8 Flujos de datos (patrón no-rerender)

```
Client Component ──fetch('/api/...')──▶ Route Handler ──checkAdmin──▶ *-core.ts ──▶ Supabase
        ▲                                                                  │
        └────────────── JSON { success, data | error } ◀───────────────────┘
        └──▶ setState local (sin router.refresh, sin re-render RSC)
```

- **Lógica compartida:** `invoice-core.ts`, `whatsapp-core.ts`, `dashboard-core.ts`, `wheel-actions.ts` concentran las consultas; Server Actions y Route Handlers consumen las mismas funciones.
- **Reportes cliente:** `jsPDF` + `autotable` generan PDF/CSV desde los datos ya cargados (Informe por Fecha, Informe por Estado) sin llamadas extra.
- **Realtime:** suscripción a cambios con debounce ≥1 s; contadores incrementales (`reportedDelta`).

---

## 8. Guía de Diagnóstico y Problemas Frecuentes

| Problema | Causa probable | Solución |
| :------- | :------------- | :------- |
| `select()` devuelve `[]` sin error | RLS bloquea la lectura | Verificar membresía en `user_companies` y política SELECT; rutas públicas dependen de `published=true`/`is_active=true` |
| Inventario lento al abrir | Antes: render de ~12,000 componentes | Ya mitigado: paginación 100 filas, SELECT explícito, páginas en paralelo, cache por evento |
| Encabezado sticky no se fija | `Table` de Tremor envuelve en `div.overflow-auto` propio | El `max-h` debe ir en el `className` de `<Table>` (su wrapper interno es el scroll container) |
| Dropdown de Tremor no llega al final | Listbox dentro de Dialog modal | Usar `<select>` nativo (patrón aplicado en `InvoiceDateReportDialog`) |
| Registro público rechaza cartones | Límite anti-abuso o cartón no vendido/ya registrado | Revisar `registration_limits` (modo `normal` vs `evento`) y motivo devuelto por `register_participant_cards` |
| Ganador no entra a otra ronda | Trigger `prevent_winner_reentry` | Es la regla de negocio: un ganador no participa en tómbolas siguientes del mismo evento |
| `ALTER TYPE ... ADD VALUE` falla | No corre dentro de transacción | Ejecutar la migración sin BEGIN/COMMIT (SQL Editor directo) |

---

## 9. Documentos Relacionados

- `Documentacion/ModeloBdBingo.md` — requerimientos y modelo de datos baseline
- `Documentacion/Tablas.md` — diccionario de tablas del esquema base
- `Documentacion/Auditoria_PreProduccion_20261001.md` — auditoría pre-evento
- `Documentacion/Analisis_Algoritmo_Sorteos.md` — algoritmo de giros/tómbola
- `Documentacion/Prueba_carga_registro.md` — resultados de prueba de carga del registro
- `Documentacion/Plan_Rollback.md` — plan de contingencia y rollback
- `Documentacion/Ambiente_staging.md` — configuración del entorno staging
- `.devin/rules/no-rerender-completo.md` — regla arquitectónica de Route Handlers
