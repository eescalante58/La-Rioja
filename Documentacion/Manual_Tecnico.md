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
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Bypass RLS; solo servidor (Route Handlers/core) |
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

**Esquema:** `public`, multi-empresa (tenant por `company_id`). **Inventario verificado contra la base de producción** (proyecto `wfkqsifhxnarmxrvbgiu`, PostgreSQL 17.6, oct-2026): 25 tablas — **todas con RLS habilitado** — 6 vistas, 6 enums, ~30 funciones propias, 28 triggers y 5 buckets de Storage. El acceso público se acota a lecturas de contenido publicado/ruletas publicadas y a la función `register_participant_cards`.

### 4.1 Enums

| Enum | Valores | Uso |
| :--- | :------ | :-- |
| `card_status_enum` | `Disponible`, `Asignado`, `Vendido`, `Cancelado`, `Donado`, `Reservado`, `Anulado` | Estado del cartón (`cards.card_status`) |
| `card_type_enum` | `Fisico`, `Virtual` | Tipo de cartón (`cards.card_type`) |
| `invoice_payment_method_enum` | `efectivo`, `tarjeta credito`, `tarjeta debito`, `transferencia` | `invoices.payment_method` |
| `invoice_status_enum` | `pagada`, `pendiente`, `anulada`, `Donada` | `invoices.status` |
| `student_level_enum` | `1.Terapeutico`, `2.Inicial`, `3.Medio`, `4.Prelaboral`, `5.Laboral`, `6.Personal La Rioja` | Nivel del alumno |
| `site_page_type` | `home`, `about`, `contact`, `global`, `social media`, `whatsapp message`, `services`, `programs`, `Bingo`, `bingo`, `tombola` | Páginas administrables del CMS. **Nota:** existen `Bingo` y `bingo` como valores distintos (enum es case-sensitive) — las consultas deben usar el case exacto del contenido |

**CHECK constraints tipo enum (no son TYPE):**

- `wheel_configs.mode` / `wheel_items.mode` / `wheel_spins.mode` / `wheel_participating_cards.mode`: `'Premios' | 'Cartones' | 'Participantes'`
- `wheels_presents_cards.mode`: solo `'Participantes'`
- `registration_limits.mode`: `'normal' | 'evento'` (valores anti-abuso: normal 10/min·40 día·30 teléfono; evento 500/min·15000 día·30 teléfono)

### 4.2 Tablas

Columnas y tipos verificados contra `information_schema.columns` (producción, oct-2026). **Las 25 tablas tienen RLS habilitado.**

#### Dominio multi-tenant / seguridad

##### Tabla: `public.companies`

**Descripción:** Empresas/tenants. Contiene la configuración base por empresa.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `company_id` | `bigint` | Identificador único de la empresa (PK). |
| `created_at` | `timestamp with time zone` | Fecha y hora de creación del registro. |
| `company_name` | `text` | Nombre legal o comercial de la empresa. |
| `phone_code_area` | `text` | Código de área telefónico (ej: 503). |
| `phone_number` | `text` | Número de teléfono de contacto. |
| `updated_at` | `timestamp with time zone` | Fecha y hora de la última actualización. |
| `web_site` | `text` | Sitio web de la empresa (URL). |
| `session_timeout_minutes` | `integer` | Minutos de inactividad antes de cerrar sesión (default 30). |
| `def_dash_event_id` | `citext` | Evento mostrado por defecto en el dashboard. |

**Notas adicionales:**

- **Clave Primaria:** `company_id`.
- **Relaciones:** Referenciada por `events` y `user_companies` mediante llaves foráneas.
- **Seguridad:** Tiene habilitado Row Level Security (RLS).

##### Tabla: `public.users`

**Descripción:** Perfil de usuarios (nombre, email, estado, rol y metadata).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del usuario (PK, FK → `auth.users`). |
| `full_name` | `text` | Nombre completo del usuario. |
| `first_name` | `text` | Primer nombre. |
| `first_second_name` | `text` | Segundo nombre. |
| `last_name` | `text` | Primer apellido. |
| `last_second_name` | `text` | Segundo apellido. |
| `email` | `text` | Correo electrónico institucional (UNIQUE). |
| `phone` | `text` | Número de teléfono de contacto. |
| `role_id` | `bigint` | ID del rol principal asignado (FK → `roles`). |
| `status` | `text` | Estado de la cuenta (active, inactive). |
| `avatar_url` | `text` | URL de la imagen de perfil (bucket `user_avatar`). |
| `metadata` | `jsonb` | Información adicional en formato JSON. |
| `created_at` | `timestamp with time zone` | Fecha de registro. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |
| `last_login` | `timestamp with time zone` | Fecha del último acceso al sistema. |
| `secondary_email` | `text` | Correo electrónico alterno. |

**Notas adicionales:**

- **Relaciones:** El trigger `handle_new_user` crea el perfil automáticamente al registrarse en `auth.users`.

##### Tabla: `public.roles`

**Descripción:** Catálogo de roles con nivel/jerarquía y estado.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `role_id` | `bigint` | Identificador único del rol (PK). |
| `name` | `text` | Nombre descriptivo del rol (admin, ventas, etc). UNIQUE. |
| `description` | `text` | Descripción de las responsabilidades del rol. |
| `level` | `integer` | Nivel de jerarquía para control de permisos. |
| `is_active` | `boolean` | Estado de activación del rol. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

##### Tabla: `public.user_companies`

**Descripción:** Relación usuario-compañía y rol dentro de la compañía.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `user_id` | `uuid` | ID del usuario (PK/FK → `users`). |
| `company_id` | `bigint` | ID de la empresa (PK/FK → `companies`). |
| `role` | `text` | Nombre del rol dentro de esta empresa específica. |
| `role_id` | `bigint` | ID técnico del rol asignado (FK → `roles`). |
| `created_at` | `timestamp with time zone` | Fecha de vinculación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |
| `default_event_id` | `citext` | Evento por defecto del usuario en esta empresa. |

**Notas adicionales:**

- **Clave Primaria:** Compuesta (`user_id`, `company_id`).
- **Relaciones:** Permite que un usuario pertenezca a múltiples empresas con roles potencialmente diferentes.
- **Seguridad:** Es la base para el filtrado por RLS en todo el sistema.

##### Tabla: `public.user_activity_log`

**Descripción:** Bitácora de auditoría de acciones administrativas.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `user_id` | `uuid` | Usuario que ejecutó la acción. |
| `action` | `text` | Acción realizada (ej: `insert`, `update`, `delete`). |
| `entity` | `text` | Tabla o entidad afectada. |
| `entity_id` | `text` | Identificador del registro afectado (**tipo text**). |
| `metadata` | `jsonb` | Datos adicionales del cambio (valores previos/nuevos). |
| `timestamp` | `timestamp with time zone` | Fecha y hora del evento. |

**Notas adicionales:**

- **Seguridad:** Inserción propia del usuario; lectura propia o por admin/reader global.

##### Tabla: `public.country_codes`

**Descripción:** Prefijos telefónicos por país para envíos de WhatsApp.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `iso2` | `character` | Código ISO de 2 letras (UNIQUE). |
| `iso3` | `character` | Código ISO de 3 letras (UNIQUE). |
| `name` | `text` | Nombre del país. |
| `phone_code` | `text` | Prefijo telefónico (ej: `503`). |
| `flag_emoji` | `text` | Emoji de la bandera del país. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

#### Dominio Bingo

##### Tabla: `public.events`

**Descripción:** Eventos de bingo por empresa (configuración del evento y meta económica).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador interno del registro (PK). |
| `company_id` | `bigint` | ID de la empresa organizadora. |
| `event_id` | `citext` | Identificador de negocio del evento (ej: `BINGO2026`). |
| `event_name` | `text` | Nombre del evento. |
| `event_cartons_number` | `integer` | Cantidad de cartones prevista del evento. |
| `event_date` | `date` | Fecha del evento. |
| `event_start_promotion_date` | `date` | Fecha de inicio de promoción/venta. |
| `event_manager` | `text` | Responsable del evento. |
| `event_description` | `text` | Descripción del evento. |
| `event_goal` | `numeric` | Meta económica de ventas. |
| `card_value` | `numeric` | Valor/precio unitario del cartón. |
| `is_active` | `boolean` | Indica si el evento está activo. |
| `status` | `text` | Estado del evento. |
| `total_amount_solded` | `numeric` | Total vendido acumulado (mantenido por trigger `fn_update_event_total_sales`). |
| `event_venue` | `text` | Lugar/sede del evento. |
| `Method_of_payment` | `text` | Métodos de pago habilitados del evento. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Relaciones:** UNIQUE (`company_id`, `event_id`) — referenciado por todas las FK compuestas de cartones, facturas, alumnos y sorteos.

##### Tabla: `public.cards`

**Descripción:** Inventario de cartones de bingo asociados a eventos.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del cartón (PK). |
| `company_id` | `bigint` | ID de la empresa a la que pertenece el cartón. |
| `event_id` | `citext` | ID del evento asociado. |
| `card_number` | `bigint` | Número impreso en el cartón. |
| `card_type` | `card_type_enum` | Tipo de cartón (Fisico, Virtual). |
| `card_status` | `card_status_enum` | Estado (Disponible, Asignado, Vendido, etc). Default `Disponible`. |
| `card_price` | `numeric` | Precio base o costo del cartón. |
| `sales_price` | `numeric` | Precio de venta final. |
| `image_url` | `text` | URL del PDF o imagen del cartón (bucket `cards_images`). |
| `invoice_number` | `citext` | Número de factura relacionada. |
| `sold_by` | `text` | Nombre de quién realizó la venta. |
| `player_name` | `text` | Nombre del jugador/comprador. |
| `player_phone_number` | `text` | Teléfono del jugador. |
| `player_email` | `text` | Email del jugador. |
| `prize` | `text` | Descripción del premio si resultó ganador. |
| `comment` | `text` | Observaciones adicionales. |
| `search_vector` | `tsvector` | Vector de búsqueda full-text (buscador universal). |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Relaciones:** Vinculada a `events` e `invoices`.
- **Constraints:** UNIQUE (`company_id`, `event_id`, `card_number`); CHECK precio ≥ 0; estado `Vendido` exige `invoice_number` + `sales_price`.

##### Tabla: `public.invoices`

**Descripción:** Facturas/comprobantes de venta de cartones.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único de la factura. |
| `company_id` | `bigint` | ID de la empresa. |
| `invoice_number` | `citext` | Número correlativo de factura (PK compuesta). |
| `invoice_date` | `date` | Fecha de emisión. |
| `customer_name` | `text` | Nombre del cliente. |
| `phone_area` | `text` | Código de área telefónica. |
| `phone_number` | `text` | Número de teléfono. |
| `whatsapp_number` | `text` | Número de WhatsApp. |
| `customer_email` | `text` | Correo electrónico del cliente. |
| `cards_number` | `integer` | Cantidad de cartones comprados. |
| `card_price` | `numeric` | Precio por cartón en esta venta. |
| `total_amount` | `numeric` | Monto total de la factura. |
| `event_id` | `citext` | ID del evento asociado. |
| `payment_method` | `invoice_payment_method_enum` | Método de pago utilizado. |
| `status` | `invoice_status_enum` | Estado (pagada, pendiente, anulada, Donada). |
| `manager_name` | `text` | Nombre del gestor/vendedor que la generó. |
| `url_invoice` | `text` | URL del comprobante adjunto (bucket `invoices_images`). |
| `send_whatsapp_message` | `text` | Estado/Log del último envío por WhatsApp. |
| `observation` | `text` | Observaciones de la factura. |
| `search_vector` | `tsvector` | Vector de búsqueda full-text (buscador universal). |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Clave Primaria:** Compuesta (`company_id`, `invoice_number`).
- **Constraints:** CHECK `total_amount` = `cards_number` × `card_price`.
- **Relaciones:** Los triggers `fn_sync_cards_with_invoice` y `fn_update_event_total_sales` mantienen cartones y totales del evento.

##### Tabla: `public.students`

**Descripción:** Alumnos que participan en los eventos de Bingo.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `company_id` | `bigint` | Identificador de la empresa. |
| `event_id` | `citext` | Identificador del evento. |
| `student_id` | `integer` | Número identificador del alumno. |
| `student_name` | `text` | Nombre completo del alumno. |
| `student_level` | `student_level_enum` | Nivel educativo o categoría del alumno. |
| `created_at` | `timestamp with time zone` | Fecha de creación del registro. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Relaciones:** UNIQUE (`company_id`, `event_id`, `student_id`); vinculada a `events` y `students_cards`.

##### Tabla: `public.students_cards`

**Descripción:** Cartones asignados a los estudiantes para su venta.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `company_id` | `bigint` | Identificador de la empresa. |
| `event_id` | `citext` | Identificador del evento. |
| `student_id` | `integer` | ID del alumno al que se le asigna el cartón. |
| `card_number` | `bigint` | Número del cartón asignado. |
| `created_at` | `timestamp with time zone` | Fecha de asignación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Relaciones:** Vincula alumnos (`students`) con cartones (`cards`) — alimenta la columna "Jugador" del inventario y el desglose por nivel del dashboard.
- **Constraints:** UNIQUE (`company_id`, `event_id`, `student_id`, `card_number`) y UNIQUE (`company_id`, `event_id`, `card_number`) — un cartón no puede ir a dos alumnos del mismo evento.

##### Tabla: `public.customer_phone_number`

**Descripción:** Directorio único de teléfonos de clientes por empresa (base de la pestaña promocional).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `company_id` | `bigint` | Identificador de la empresa. |
| `phone_number` | `text` | Número de teléfono del cliente. |
| `customer_name` | `text` | Nombre del cliente. |
| `table_data_source` | `text` | Origen del dato (tabla que alimentó el registro). |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Constraints:** UNIQUE (`company_id`, `phone_number`); alimentada por `sync_customers_from_cards()`.

##### Tabla: `public.whatsapp_promo_logs`

**Descripción:** Bitácora de envíos masivos de mensajes promocionales por WhatsApp.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `batch_id` | `uuid` | Identificador del lote/campaña de envío. |
| `company_id` | `bigint` | Identificador de la empresa. |
| `customer_name` | `text` | Nombre del destinatario. |
| `phone_number` | `text` | Teléfono del destinatario. |
| `message_body` | `text` | Cuerpo del mensaje enviado. |
| `image_url` | `text` | Imagen adjunta al mensaje (opcional). |
| `status` | `text` | Estado del envío (enviado, error, etc). |
| `error_message` | `text` | Detalle del error si el envío falló. |
| `created_at` | `timestamp with time zone` | Fecha y hora del envío. |

#### Dominio CMS / sitio público

##### Tabla: `public.site_content`

**Descripción:** Secciones administrables del sitio público por página.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `page` | `site_page_type` | Página a la que pertenece la sección. |
| `section_key` | `text` | Clave de la sección dentro de la página. |
| `title` | `text` | Título del contenido. |
| `description` | `text` | Texto/cuerpo del contenido. |
| `image_url` | `text` | Imagen asociada (bucket `cms_images`). |
| `content_order` | `integer` | Orden de despliegue dentro de la página. |
| `is_active` | `boolean` | Indica si el contenido está publicado. |
| `metadata` | `jsonb` | Datos adicionales específicos de la sección. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Constraints:** UNIQUE (`page`, `section_key`, `content_order`); lectura pública solo si `is_active`.
- **Relaciones:** El trigger `tr_log_site_content_activity` audita cambios en `user_activity_log`.

##### Tabla: `public.faq_sections`

**Descripción:** Secciones/categorías de preguntas frecuentes.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `title` | `text` | Título de la sección. |
| `description` | `text` | Descripción de la sección. |
| `content_order` | `integer` | Orden de despliegue. |
| `is_active` | `boolean` | Indica si la sección está publicada. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

##### Tabla: `public.faqs`

**Descripción:** Preguntas frecuentes del sitio público.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `question` | `text` | Pregunta. |
| `answer` | `text` | Respuesta. |
| `section_id` | `uuid` | Sección a la que pertenece (FK → `faq_sections`). |
| `content_order` | `integer` | Orden de despliegue. |
| `is_active` | `boolean` | Indica si la FAQ está publicada. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

##### Tabla: `public.contact_submissions`

**Descripción:** Mensajes recibidos desde el formulario de contacto del sitio público.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `created_at` | `timestamp with time zone` | Fecha de recepción. |
| `name` | `text` | Nombre del remitente. |
| `email` | `text` | Correo del remitente. |
| `phone` | `text` | Teléfono del remitente. |
| `type` | `text` | Tipo de solicitud. |
| `message` | `text` | Cuerpo del mensaje. |
| `target_email` | `text` | Correo destino al que se reenvió la solicitud. |

##### Tabla: `public.event_gallery`

**Descripción:** Fotos de la galería pública del evento.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `uuid` | Identificador único del registro (PK). |
| `company_id` | `bigint` | Identificador de la empresa. |
| `event_id` | `citext` | Identificador del evento. |
| `image_url` | `text` | URL de la imagen (bucket `event_gallery_images`). |
| `thumbnail_url` | `text` | URL de la miniatura. |
| `caption` | `text` | Leyenda de la foto. |
| `content_order` | `integer` | Orden de despliegue. |
| `is_active` | `boolean` | Indica si la foto está publicada. |
| `created_at` | `timestamp without time zone` | Fecha de creación (sin zona horaria). |
| `updated_at` | `timestamp without time zone` | Fecha de última actualización (sin zona horaria). |

#### Dominio sorteos (ruleta y tómbola)

##### Tabla: `public.wheel_configs`

**Descripción:** Cabecera de configuración de cada ruleta/tómbola.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único de la ruleta (PK). |
| `company_id` | `bigint` | ID de la empresa. |
| `event_id` | `citext` | ID del evento asociado. |
| `mode` | `text` | Modo: `Premios`, `Cartones` o `Participantes` (CHECK). |
| `wheel_name` | `text` | Nombre de la ruleta/tómbola. |
| `published` | `boolean` | Indica si está publicada y visible al público. |
| `created_by` | `uuid` | Usuario que creó la ruleta. |
| `time_rotation` | `integer` | Tiempo de rotación manual (segundos). |
| `is_automatic_rotation` | `boolean` | Habilita la rotación automática. |
| `automatic_timeout_rotation` | `integer` | Timeout de la rotación automática. |
| `prizes_number` | `integer` | Máximo de premios (0 = sin límite). |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Constraints:** UNIQUE (`company_id`, `event_id`, `mode`, `wheel_name`); FK → `events`.
- **Relaciones:** Padre de `wheel_items`, `wheel_spins`, `wheel_participating_cards` y `wheels_presents_cards` (FK CASCADE).

##### Tabla: `public.wheel_items`

**Descripción:** Segmentos/premios configurados en la ruleta.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del segmento (PK). |
| `wheel_id` | `bigint` | Ruleta a la que pertenece (FK → `wheel_configs` CASCADE). |
| `company_id` | `bigint` | ID de la empresa. |
| `event_id` | `citext` | ID del evento. |
| `mode` | `text` | Modo heredado de la ruleta. |
| `wheel_name` | `text` | Nombre de la ruleta (desnormalizado). |
| `label` | `text` | Texto visible del segmento. |
| `color` | `text` | Color del segmento en la ruleta. |
| `quantity` | `integer` | Stock disponible del premio. |
| `initial_quantity` | `integer` | Stock inicial configurado (referencia de reabastecimiento). |
| `position` | `smallint` | Posición del segmento en la ruleta. |
| `is_prize` | `boolean` | Indica si el segmento entrega premio. |
| `is_active` | `boolean` | Segmento habilitado. |
| `created_at` | `timestamp with time zone` | Fecha de creación. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

##### Tabla: `public.wheel_spins`

**Descripción:** Auditoría de cada giro de la ruleta/tómbola.

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del giro (PK). |
| `wheel_id` | `bigint` | Ruleta girada (FK → `wheel_configs` CASCADE). |
| `company_id` | `bigint` | ID de la empresa. |
| `event_id` | `citext` | ID del evento. |
| `mode` | `text` | Modo de la ruleta al momento del giro. |
| `wheel_name` | `text` | Nombre de la ruleta. |
| `item_id` | `bigint` | Segmento ganador (FK → `wheel_items`). |
| `winner_label` | `text` | Etiqueta ganadora mostrada. |
| `card_number` | `bigint` | Número de cartón ganador (modos Cartones/Participantes). |
| `prize_label` | `text` | Premio asignado al ganador. |
| `spun_by` | `uuid` | Usuario que ejecutó el giro. |
| `spun_at` | `timestamp with time zone` | Fecha y hora del giro. |
| `verification_hash` | `text` | Hash de integridad del resultado (auditoría). |

##### Tabla: `public.wheel_participating_cards`

**Descripción:** Cartones vendidos/donados cargados a una tómbola (modos Cartones y Participantes con cartones del inventario).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `wheel_id` | `bigint` | Tómbola a la que pertenece (FK → `wheel_configs`). |
| `company_id` | `bigint` | ID de la empresa. |
| `event_id` | `citext` | ID del evento. |
| `mode` | `text` | Modo de la tómbola. |
| `wheel_name` | `text` | Nombre de la tómbola. |
| `card_number` | `bigint` | Número del cartón participante. |
| `is_winner` | `boolean` | Indica si el cartón resultó ganador. |
| `won_at` | `timestamp with time zone` | Fecha y hora en que ganó. |
| `winner_name` | `text` | Nombre del ganador capturado al confirmar. |
| `winner_prize` | `text` | Premio asignado. |
| `document_type` | `text` | Tipo de documento del ganador. |
| `document_number` | `text` | Número de documento del ganador. |
| `winner_phone_number` | `text` | Teléfono del ganador. |
| `winner_registered_at` | `timestamp with time zone` | Fecha de captura de los datos del ganador. |
| `winner_order` | `integer` | Orden del premio (trigger `set_winner_order`). |
| `observation` | `text` | Observaciones del resultado. |
| `created_at` | `timestamp with time zone` | Fecha de carga del cartón. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Constraints:** UNIQUE (`company_id`, `event_id`, `wheel_id`, `card_number`); FK compuesta → `cards`; trigger `prevent_winner_reentry` evita recargar ganadores.

##### Tabla: `public.wheels_presents_cards`

**Descripción:** Cartones auto-registrados por los asistentes desde el formulario público `/registro` (tómbola modo Participantes).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `wheel_id` | `bigint` | Tómbola a la que pertenece (FK → `wheel_configs`). |
| `company_id` | `bigint` | ID de la empresa. |
| `event_id` | `citext` | ID del evento. |
| `mode` | `text` | Modo (solo `Participantes`, CHECK). |
| `wheel_name` | `text` | Nombre de la tómbola. |
| `card_number` | `bigint` | Número del cartón registrado. |
| `player_name` | `text` | Nombre del asistente registrado. |
| `player_phone_number` | `text` | Teléfono del asistente. |
| `registered_ip` | `text` | IP del registro (control anti-abuso). |
| `is_winner` | `boolean` | Indica si el cartón resultó ganador. |
| `won_at` | `timestamp with time zone` | Fecha y hora en que ganó. |
| `winner_order` | `integer` | Orden del premio (trigger `set_winner_order_presents`). |
| `winner_name` | `text` | Nombre del ganador al confirmar. |
| `winner_prize` | `text` | Premio asignado. |
| `document_type` | `text` | Tipo de documento del ganador. |
| `document_number` | `text` | Número de documento del ganador. |
| `winner_phone_number` | `text` | Teléfono del ganador. |
| `winner_registered_at` | `timestamp with time zone` | Fecha de captura de los datos del ganador. |
| `observation` | `text` | Observaciones del resultado. |
| `created_at` | `timestamp with time zone` | Fecha de registro. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |

**Notas adicionales:**

- **Constraints:** UNIQUE (`company_id`, `event_id`, `card_number`); FK → `cards`.
- **Seguridad:** Las inserciones públicas pasan por la función `register_participant_cards` (validación atómica + anti-abuso).

##### Tabla: `public.registration_attempts`

**Descripción:** Log de intentos de registro público por IP (ventana anti-ráfaga).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `bigint` | Identificador único del registro (PK). |
| `client_ip` | `text` | IP del cliente que intentó registrar. |
| `attempted_at` | `timestamp with time zone` | Fecha y hora del intento. |

**Notas adicionales:**

- **Seguridad:** Sin políticas RLS — solo accesible vía la función `register_participant_cards` (security definer).

##### Tabla: `public.registration_limits`

**Descripción:** Configuración anti-abuso del registro público (**fila única** `id = 1`).

| Columna | Tipo de Datos | Comentario |
| :------ | :------------ | :--------- |
| `id` | `smallint` | Identificador fijo (CHECK `id = 1`). |
| `mode` | `text` | Modo `normal` o `evento` (CHECK). |
| `max_attempts_minute` | `integer` | Intentos máximos por minuto por IP. |
| `max_cards_day_ip` | `integer` | Cartones máximos por día por IP. |
| `max_cards_phone` | `integer` | Cartones máximos por teléfono. |
| `updated_at` | `timestamp with time zone` | Fecha de última actualización. |
| `updated_by` | `uuid` | Usuario que modificó la configuración. |

**Notas adicionales:**

- **Valores:** normal = 10/min · 40 día · 30 teléfono; evento = 500/min · 15000 día · 30 teléfono.
- **Seguridad:** Lectura para autenticados; escritura solo admin global.

### 4.3 Índices

Inventario verificado contra `pg_indexes` (producción, oct-2026). No se listan las PK de tablas lookup (`*_pkey` triviales).

**`cards` — inventario y búsqueda:**

| Índice | Definición | Propósito |
| :----- | :--------- | :-------- |
| `cards_company_event_card_uk` | UNIQUE (company_id, event_id, card_number) | Clave natural del cartón; inventario ordenado, point lookup y range checks |
| `idx_cards_event_company` | (company_id, event_id) | Filtro por evento sin número |
| `cards_company_id_event_id_card_status_idx` | (company_id, event_id, card_status) | Filtros por estado (informe por estado, dashboards) |
| `idx_cards_id_event_invoice_number` | (company_id, event_id, invoice_number) | Cartones de una factura |
| `idx_cards_invoice_number` | (invoice_number) | Lookup global por factura |
| `idx_cards_number_text` | ((card_number)::text) | Comparaciones textuales del número |
| `idx_cards_number_trgm` | GIN ((card_number)::text gin_trgm_ops) | Búsqueda por prefijo/parcial del número (ext. `pg_trgm`) |
| `idx_cards_search_vector` | GIN (search_vector) | Full-text search del buscador universal |

**`invoices` — ventas y búsqueda:**

| Índice | Definición | Propósito |
| :----- | :--------- | :-------- |
| `invoices_pkey` | UNIQUE (company_id, invoice_number) | PK compuesta |
| `idx_invoices_event_company` | (company_id, event_id) | Filtro base por evento |
| `invoices_company_status_idx` | (company_id, event_id, status) | Filtros por estado (pagada/pendiente/anulada/Donada) |
| `invoices_company_date_idx` | (company_id, invoice_date) | Cortes por fecha |
| `idx_invoices_company_event_date` | (company_id, event_id, invoice_date DESC) | Lista del evento por fecha |
| `idx_invoices_company_event_number` | (company_id, event_id, invoice_number) | Duplicados y correlativo `FactAut-%` |
| `idx_invoices_company_event_created_at` | (company_id, event_id, created_at DESC) | Orden real "más reciente primero" |
| `idx_invoices_number_trgm` | GIN (invoice_number gin_trgm_ops) | Búsqueda parcial de N° factura |
| `idx_invoices_search_vector` | GIN (search_vector) | Full-text search del buscador universal |

**Sorteos (índices parciales `WHERE is_winner` — pendientes vs ganadores):**

| Índice | Tabla | Definición |
| :----- | :---- | :--------- |
| `uq_wheel_config` | wheel_configs | UNIQUE (company_id, event_id, mode, wheel_name) |
| `idx_wheel_items_wheel` / `idx_wheel_items_event_mode` | wheel_items | (wheel_id) / (company_id, event_id, mode, wheel_name) |
| `idx_wheel_spins_wheel` / `idx_wheel_spins_event_mode` | wheel_spins | (wheel_id) / (company_id, event_id, mode, wheel_name) |
| `uq_wheel_participating` | wheel_participating_cards | UNIQUE (company_id, event_id, wheel_id, card_number) |
| `idx_wheel_part_wheel` | wheel_participating_cards | (wheel_id) WHERE is_winner = false — pool sorteable |
| `idx_wheel_part_winners` | wheel_participating_cards | (wheel_id) WHERE is_winner = true — galería ganadores |
| `idx_wheel_part_registered` | wheel_participating_cards | (wheel_id, winner_registered_at) WHERE is_winner — orden de captura |
| `uq_wheels_presents` | wheels_presents_cards | UNIQUE (company_id, event_id, card_number) — un registro por evento |
| `idx_wheels_presents_wheel` / `_winners` / `_registered` | wheels_presents_cards | Idem tómbola pública (parciales WHERE is_winner) |

**Resto:**

| Índice | Definición |
| :----- | :--------- |
| `events_company_event_uk` / `events_company_id_event_id_key` | UNIQUE (company_id, event_id) — base de todas las FK compuestas |
| `students_company_event_student_uk` + `idx_students_event_company` | UNIQUE (company_id, event_id, student_id); filtro por evento |
| `students_cards_company_event_student_card_uk` + `students_cards_unique_card_per_event` | UNIQUE (…student_id, card_number) y UNIQUE (…card_number) |
| `idx_students_cards_student_id` / `idx_students_cards_card_number` | Joins por alumno y por cartón |
| `idx_registration_attempts_ip_time` | (client_ip, attempted_at DESC) — ventana anti-ráfaga |
| `uq_site_content_page_section_order` | UNIQUE (page, section_key, content_order) |
| `user_companies` | PK (user_id, company_id) + idx (company_id, user_id) + (user_id, company_id, role_id) |
| `users_email_key`, `roles_name_key`, `country_codes_iso2/iso3_key`, `customer_phone_number_company_id_phone_number_key` | Uniques de catálogos |

### 4.4 Vistas

| Vista | Definición / Propósito |
| :---- | :--------------------- |
| `v_students_with_counts` | `students` LEFT JOIN conteo de `students_cards` por (company_id, event_id, student_id) → `assigned_cards_calc`. Alimenta "Asignación por Nivel" |
| `v_sold_by` | `DISTINCT company_id, event_id, manager_name AS sold_by` desde invoices — catálogo de vendedores con ventas |
| `v_promo_batch_summary` | Resumen por `batch_id`+empresa de `whatsapp_promo_logs`: total, success_count, error_count, started_at, finished_at |
| `v_invoices` | Facturas con encabezados en español ("Numero factura", "Metodo de pago", "Total factura", "Gestor venta", etc.) — reportes/exportación |
| `v_customer_search` | `customer_phone_number` reducido a (id, company_id, customer_name, phone_number) — búsqueda de clientes |
| `v_unique_player_phone_number` | `DISTINCT company_id, event_id, player_phone_number, player_name` desde cards — directorio de jugadores compradores |

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
| `set_timestamps()` | Trigger genérico `updated_at = now()` (la mayoría de las tablas) |
| `update_updated_at_column()` | Variante del anterior usada por `faqs` y `faq_sections` |
| `sync_user_companies_role()` | Mantiene consistente `role`↔`role_id` en user_companies |
| `log_user_activity(action, entity, entity_id uuid, metadata jsonb)` | Inserta en la bitácora `user_activity_log` |
| `handle_new_user()` | SECURITY DEFINER — trigger en `auth.users`: crea el perfil en `public.users` al registrarse |
| `fn_sync_cards_with_invoice()` | Trigger en `invoices`: sincroniza cartones con la factura (asociación de cartones) |
| `fn_update_event_total_sales()` | Trigger en `invoices`: mantiene `events.total_amount_solded` acumulado |
| `fn_log_site_content_activity()` | SECURITY DEFINER — trigger en `site_content`: registra cambios del CMS en la bitácora |
| `sync_customers_from_cards()` | SECURITY DEFINER — sincroniza `customer_phone_number` desde `cards` (directorio de clientes) |

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

**Extensión `pg_trgm`** (instalada): funciona `similarity`, `show_trgm`, `gin_trgm_*`, etc. — soporta los índices trigram `idx_cards_number_trgm` / `idx_invoices_number_trgm` y la búsqueda parcial de `busqueda_universal`. Las columnas `search_vector` (cards, invoices) tienen índice GIN para full-text search.

### 4.6 Triggers

| Trigger | Tabla | Propósito |
| :------ | :---- | :-------- |
| `trg_*_set_timestamps` / `update_*_updated_at` | cards, companies, country_codes, events, invoices, roles, site_content, students, students_cards, user_companies, users, wheel_configs, wheel_items, wheel_participating_cards, wheels_presents_cards, faqs, faq_sections | `updated_at` automático vía `set_timestamps()` / `update_updated_at_column()` |
| `trg_cards_validate_invoice_event` | cards | Coherencia factura↔evento |
| `tr_sync_cards_with_invoice` | invoices | `fn_sync_cards_with_invoice` — sincroniza cartones con la factura |
| `tr_sync_event_sales` | invoices | `fn_update_event_total_sales` — mantiene `events.total_amount_solded` |
| `tr_log_site_content_activity` | site_content | `fn_log_site_content_activity` — audita cambios del CMS |
| `trg_user_companies_sync_role` | user_companies | Sincroniza rol textual ↔ role_id |
| `on_auth_user_created` (`handle_new_user`) | auth.users | Crea el perfil en `public.users` al registrarse (schema auth) |
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
