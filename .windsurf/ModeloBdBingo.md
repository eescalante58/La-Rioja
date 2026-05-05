# Plan de Proyecto: Sitio Web Institucional y Módulo de Bingo

## Propósito: Este documento define instrucciones de trabajo para construir una web institucional de La Rioja, una entidad de formación laboral para personas con discapacidad intelectual.

## 1. Objetivos y criterios de éxito

- Comunicación institucional clara: presentar misión, oferta formativa, servicios y vías de contacto con lenguaje simple.
- Accesibilidad prioritaria: diseñar y construir con enfoque de accesibilidad (meta: WCAG 2.2 nivel AA).
- Autonomía operativa: permitir que personal autorizado actualice contenidos del home y about page sin depender del equipo técnico.

- Gestión de bingo: administrar lotes/cartones, ventas, asignaciones, estado de pago y reportes básicos.

- Dashboard : Contar con un dashboard ejecutivo que muestre los resultados consolidados de la gestiòn.

- Seguridad y trazabilidad: control de acceso por roles y registro de acciones administrativas.

## Criterios de éxito (ejemplos medibles): (a) Módulo de registro de usuarios y CMS y consulta de historial de cambios; (b) sitio público publicado con contenido mínimo viable; (c) módulo de bingo con flujo completo “crear evento” → “crear lote → publicar disponibilidad → registrar venta → registrar cartones y enviar por whatsapp → ; (d) verificación de accesibilidad (auditoría interna + pruebas manuales de teclado y lector de pantalla); (e) políticas RLS activas en todas las tablas expuestas; (e ) Dashboard ejecutivo funcionando

## 2. Alcance del proyecto

### 2.1 En alcance

- Web pública con secciones: Homepage y About. HomePage incluir área de iconos de enlaces a redes sociales (Instagram, Facebook, X, Whatsapp). con footer de derechos reservados La Rioja 2026

- Página/área de administración de contenido para la home y about page (textos, secciones, imágenes ya existentes en el repositorio o cargadas por Storage, llamados a la acción).

- Pàgina/Módulo de gestión de usuarios, CMS dinámico y tabla de paises
  Usuario: - Registro de perfiles de usuarios - CMS: CRUD de contenido del sitio. - Còdigos de países: CRUD tabla de códigos de países para anexar a números de telefono
- Módulo de gestión y venta de cartones de bingo (backoffice):
  - Cartones
    - Registro del evento

    - Registro de cartones individual y por lotes. Ambas opciones deben permitir cargar los cartones desde un dispositivo (Pc, laptop, Tablet)

    - Exportacion de cartones a excel

  - Ventas
    - Registro de factura, debe permitir
      Asignar cartones a la factura
      y Enviar por whatsapp factura con los cartones correspondientes. El envio será mediante un link wa.me con mensaje predefinido (gratis) que se obtentrá de la tabla site_content con typo de pagina = "whatsapp message"
    - Exportacion de facturas a excel

- Dashboard : Contar con un dashboard ejecutivo que muestre los siguientes elementos:
  - Comparativo de meta de venta vs cartones vendidos en valores monetarios.

  - Ventas por día en número de cartones y valores monetarios.

  - Venta de cartones por año en valores monetarios.

  - Ventas por manager de ventas (Nombre del manager y valor vendido) ordenado de desendentemente por valor vendido.

  - Ventas de cartones por alumno (Nombre del alumno, valor de cartones asignados, valor de cartones vendidos).
  - Actividades recientes (cartones registrados, cartones vendidos)

- Autenticación y autorización (roles) para áreas administrativas.

- Modelo de datos en Supabase + políticas de seguridad (RLS).

- Despliegue a un entorno productivo (p. ej. Vercel para Next.js) y configuración de Supabase.

  2.2 Fuera de alcance (por ahora)

- Aplicación móvil nativa.
- Streaming/operación del sorteo de bingo (motor de juego). Este proyecto cubre la administración y venta de cartones, no el sorteo.
- Integraciones complejas (ERP/CRM) o automatizaciones avanzadas.

- Contabilidad formal y facturación electrónica (si se requiere, se diseña como fase posterior).

  ### 2.3 Usuarios objetivo

- Público general: familiares, empresas aliadas, donantes, comunidad.
- Personas interesadas en formación: potenciales participantes, cuidadores y acompañantes.

- Equipo de comunicación: administra contenido de CMS (Imágenes, textos, secciones, campañas).

- Administración de bingo: Eventos, Cartones, facturas
- Supervisor/a: consulta reportes y auditoría, autoriza cambios sensibles.

## 3. Estructura del sitio (mapa de navegación)

- / (Homepage)
- /about (Sobre la institución)
- /admin/CRUD (Perfiles de usuario, Administración de CMS, Còdigos paises)
- /admin/bingo (Gestión de bingo:

- Dashboard, cartones, ventas)
- /login (Acceso a áreas /admin/CRUD y /admin/bingo)

## 4. Requerimientos funcionales

### 4.1 Homepage

- Header con navegación clara, accesible por teclado, con foco visible.
- Sección “Qué hacemos” (resumen de programas), con llamados a la acción.

- Sección de programas/servicios con tarjetas (título, resumen, enlace).

- Sección de aliados/testimonios (opcional en MVP).
- Footer con contacto, dirección, redes (si aplica) y política de privacidad.
- Contenido administrable (parcial o total) desde el panel administrativo, según el modelo definido.

### 4.2 Quienes somos

- Misión, visión, valores y enfoque inclusivo.

- Organizaciòn
- Historia / equipo (con opción de ocultar datos personales sensibles).
- Oferta formativa (resumen por áreas) y metodología.
- Sección de contacto: formulario (opcional) o datos de contacto.

### 4.3 Login

#### 4.3.1 Verificar formato de email.

#### 4.3.2 Permitir provider externo

- Cuenta Google
- Cuenta Facebook
- Cuenta X
- Cuenta Apple

#### 4.3.3 Password

- Tamaño minimos del pasword: 8 caracteres, al menos una letra mayuscula, digitos 0 al 8, 1 caracter especial.

#### 4.3.4 Registro de Perfil.

- Permitir registrar perfil en tabla user. Se permitirá registrarse en la tabla user desde este punto unicamente al usuario autenticado.

#### 4.3.5 Selección de empresa

- Una vez logueado el usuario, el usuario debe seleccionar la empresa con la que desea trabajar. Utilizar tabla companies. Mantener el codigo de la empresa durante toda la sesión que el usuario este logueado.

#### 4.3.5 Boton Olvido contraseña.

- Permitir restablecer contraseña.

#### 4.3.6 Permitir registrarse.

- con validaciones de email y password; Dar la opciòn de registrarse con username de provider externo (Cuenta Google, Cuenta Facebook, Cuenta X, Cuenta Apple). Al registrarse con proveedor externo poblar la tabla users con los campos a los que se tenga acceso.

### 4.4 Administración de contenido CMS y tablas de apoyo

- El acceso a estas opciones unicamente se permitirá a usuarios el el roles "admin" y "admin_empresa"

- Login requerido.

#### 4.4.1 Editor de secciones: habilitar/deshabilitar secciones y reordenar tabla CMS dinamico(site_content)

- Campos típicos: tipo de pagina, sección, titulo de la sección, imágenes (cargadas a Storage), descripción de imagen, orden de presentación, toggle si está activa y metadatos SEO básicos (title/description).
- Previsualización antes de publicar.
- Publicación con “estado”: borrador / publicado.
- Historial mínimo: fecha, usuario, cambios (audit log).

#### 4.4.2 CRUD Tabla de codigos de paises (country_codes)

- Permitir CRUD individual, así como importación masiva de archivo CSV/Excel.

#### 4.4.3 CRUD Tabla empresas (companies)

- Permitir CRUD individual, así como importación masiva de archivo CSV/Excel.

#### 4.4.4 CRUD Tablas usuarios(users).

- Permitir CRUD individual, así como importación masiv de archivo CSV/EXCEL.

#### 4.4.4 CRUD tabla Relación usuario-empresa-rol(user_companies)

- Permitir CRUD individual, así como importación masiva de archivo CSV/Excel.

#### 4.4.5 CRUD Tabla de alumnos (students)

- Permitir CRUD individual, así como importación masiva de archivo CSV/Excel. Un alumno puede estar en varios eventos simultáneamente.

#### 4.4.6 CRUD tabla Asignación de cartones a alumnos.

- Permitir CRUD individual, así como importación masiva de archivo CSV/Excel.

### 4.4.7 CRUD Auditoría de acciones de usuarios(user_activity_log)

- Permitir CRUD individual, y consulta masiva por usuario, fecha, tabla, etc.

### 4.5 Módulo de bingo: gestión y venta de cartones

El acceso a estas opciones unicamente se permitirá a usuarios el el roles "admin", "admin_empresa" y "ventas"

#### 4.5.1 Cartones

- Crear eventos de acuerdo a tabla events

- Cargar lotes de cartones asociados a un evento en tabla cards
- Estados del cartón.
- Asignación opcional a vendedor/a (si existe operación con vendedores).
- Búsqueda y filtros (por evento, estado, vendedor/a, rango de números).
- Reserva temporal de cartones para evitar sobreventa (idealmente transaccional).

#### 4.5.2 Ventas y pagos

- Registrar venta de acuerdo a tabla invoices. Asociar cartones a cada factura y un botón para enviar por whatsapp factura y cartones asociados. El envio será mediante un link wa.me con mensaje predefinido (gratis) que se obtentrá de la tabla site_content con typo de pagina = "whatsapp message".

- Flujo de anulación/reverso con motivo y auditoría.

- Control de cortes: ventas por día/evento/vendedor.

#### 4.5.3 Reportes y auditoría

- Exportación(CSV) de ventas y cartones
- Bitácora (audit log): altas/bajas/cambios en eventos, lotes, cartones y ventas.

## 5 Dashboard

El acceso a estas opciones unicamente se permitirá a usuarios el el roles "admin", "admin_empresa", "ventas" y "reader". Para mantener el estilo minimalista utilizar la librería de gráficas Tremor.

### 6. Requerimientos no funcionales

#### 6.1 Accesibilidad (meta: WCAG 2.2 AA)

- Navegación completa por teclado y foco visible.
- Semántica HTML correcta (títulos, landmarks, botones/inputs nativos).
- Contraste adecuado y tipografía legible; evitar texto incrustado en imágenes.
- Formularios con etiquetas, ayudas y mensajes de error comprensibles.
- Tamaño mínimo de objetivos táctiles y evitar interacciones solo por arrastre.
- Autenticación usable: permitir autocompletado, copiar/pegar y gestores de contraseñas.
- Todas las paginas y formularios deben tener botones para retornar a puntos desde donde se le invoco, asi como, hacia la homepage.

### 6.2 Estilos

- Diseño reponsivo (desktop, laptop, tablet, smartphone)
  Los colores oficiales de la institución son: Amarillo(FFFF00), verde(1E9922) y azul(012060).
- Diseño minimalista
- Tipo de letra: San Serifs Monserrat
- Usar javicon
- Usar logo de La Rioja en todas las paginas y formularios

#### 6.3 Seguridad y privacidad

- Autenticación con Supabase Auth y protección de rutas administrativas.

- Políticas de Row Level Security (RLS) habilitadas en todas las tablas expuestas por API.

- Separación de privilegios: uso restringido de claves con permisos elevados (service role) únicamente en servidor/funciones.

- Registro de auditoría para acciones sensibles (publicación de contenido, anulaciones de ventas, cambios de precio).

- Protección contra abuso: rate limiting (si se añaden endpoints), validación de entrada y sanitización.

### 6.4 Rendimiento y operación

- SEO básico en páginas públicas (metadatos, rendimiento, estructura).
- Carga rápida: optimización de imágenes, división de bundles y caching donde aplique.
- Frontoffice y Backoffice responsive (mínimo para tablet/laptop).
- Entornos: desarrollo / staging / producción con variables de entorno separadas.

## 7. Arquitectura propuesta

### 7.1 Stack Tecnológico

- Frontend: Next.js 14+ (App Router) con React.ts.
- Estilos: Tailwind CSS (basado en la paleta oficial).
- Backend & Base de Datos: Supabase (PostgreSQL, Auth, Storage, realtime).
- Despliegue: Vercel o similar.
- Documentar el codigo utilizando JSDOC

## 8. Modelo de datos, Roles, permisos y políticas

A continuación tienes un **Documento Ejecutivo de Documentación Técnica** del **schema public - Sistema Bingo (Supabase / PostgreSQL)**, redactado con enfoque **DBA / auditoría / continuidad operativa**, listo para incorporar en documentación oficial (Confluence, Notion, PDF o repositorio técnico).

**Fuente**: análisis directo del dump schema_public.sql proporcionado  
**Motor**: PostgreSQL 17.x sobre Supabase  
**Alcance**: esquema public

**📘 Documento Ejecutivo - Base de Datos Bingo**

**1. Visión general del esquema**

El esquema public implementa un **modelo multi‑empresa (multi‑tenant)** para la gestión de eventos de bingo, venta de cartones, facturación, estudiantes asociados a eventos y control de usuarios/roles, apoyado en:

- **Row Level Security (RLS)** en todas las tablas sensibles
- **Políticas de acceso basadas en roles globales y por empresa**
- **Integridad referencial estricta** (FKs, UNIQUE, CHECK)
- **Triggers de negocio y auditoría**
- **Funciones SECURITY DEFINER controladas**
- **Compatibilidad nativa con Supabase Auth**

**2. Tipos ENUM**

**card_status_enum**

Estados posibles de un cartón:

- Disponible
- Asignado
- Vendido
- Cancelado

**card_type_enum**

- Fisico
- Virtual

**invoice_payment_method_enum**

- efectivo
- tarjeta credito
- tarjeta debito
- transferencia

**invoice_status_enum**

- pagada
- pendiente
- anulada

**student_level_enum**

Niveles educativos:

- 1.Terapeutico
- 2.Inicial
- 3.Medio
- 4.Prelaboral
- 5.Laboral

**site_page_type**

- home
- about
- contact
- global
- social media
- whatsapp message

**3. Tablas principales**

**3.1 companies**

Empresas organizadoras del bingo.

| **Columna**     | **Tipo**    | **Descripción**             |
| --------------- | ----------- | --------------------------- |
| company_id      | bigint (PK) | Identificador de la empresa |
| company_name    | text        | Nombre comercial            |
| phone_code_area | text        | Código de área              |
| phone_number    | text        | Teléfono                    |
| created_at      | timestamptz | Alta                        |
| updated_at      | timestamptz | Última actualización        |

RLS habilitado, acceso por empresa o rol global.

**3.2 events**

Eventos de bingo por empresa.

| **Columna**             | **Tipo**      | **Descripción**                     |
| ----------------------- | ------------- | ----------------------------------- |
| id                      | bigint (PK)   | ID interno                          |
| company_id              | bigint (FK)   | Empresa propietaria                 |
| event_id                | citext        | Código lógico del evento            |
| event_name              | text          | Nombre                              |
| event_date              | date          | Fecha                               |
| event_cartons_number    | integer       | Cantidad de cartones                |
| event_goal              | numeric(12,2) | Objetivo monetario                  |
| event_manager           | text          | Responsable                         |
| created_at / updated_at | timestamptz   | Auditoría                           |
| card_price              | numeric(12,2) | Valor del carton                    |
| is_active               | bool          | Estado del evento (Activo, Cerrado) |

**Constraints relevantes**

- UNIQUE(company_id, event_id)
- CHECK(trim(event_id))

**3.3 cards**

Cartones físicos o virtuales.

| **Columna**             | **Tipo**         |
| ----------------------- | ---------------- |
| id                      | bigint (PK)      |
| company_id              | bigint           |
| event_id                | citext           |
| card_number             | bigint           |
| card_type               | card_type_enum   |
| card_status             | card_status_enum |
| card_price              | numeric(12,2)    |
| sales_price             | numeric(12,2)    |
| invoice_number          | citext           |
| sold_by                 | text             |
| player_name             | text             |
| player_phone_number     | text             |
| player_email            | text             |
| prize                   | text             |
| comment                 | text             |
| created_at / updated_at | timestamptz      |

**Constraints clave**

- UNIQUE(company_id, event_id, card_number)
- Precio no negativo
- Vendido requiere invoice_number y sales_price

**Triggers**

- set_timestamps
- trg_cards_validate_invoice_event (valida coherencia factura-evento)

**3.4 invoices**

Facturación de ventas.

| **Columna**             | **Tipo**    |
| ----------------------- | ----------- |
| company_id              | bigint      |
| invoice_number          | citext      |
| id                      | uuid        |
| invoice_date            | date        |
| customer_name           | text        |
| cards_number            | integer     |
| card_price              | numeric     |
| total_amount            | numeric     |
| event_id                | citext      |
| payment_method          | enum        |
| status                  | enum        |
| created_at / updated_at | timestamptz |
| sold_by                 | text        |

**PK compuesta**

- (company_id, invoice_number)

**Checks**

- Total = cards_number \* card_price
- Valores positivos

**3.5 students**

Alumnos asociados a eventos.

| **Columna**             | **Tipo**           |
| ----------------------- | ------------------ |
| id                      | bigint (PK)        |
| company_id              | bigint             |
| event_id                | citext             |
| student_id              | integer            |
| student_name            | text               |
| student_level           | student_level_enum |
| created_at / updated_at | timestamptz        |

UNIQUE(company_id, event_id, student_id)

**3.6 students_cards**

Asignación de cartones a estudiantes.

| **Columna**             | **Tipo**    |
| ----------------------- | ----------- |
| id                      | bigint (PK) |
| company_id              | bigint      |
| event_id                | citext      |
| student_id              | integer     |
| card_number             | bigint      |
| created_at / updated_at | timestamptz |

- Evita duplicación de cartones por evento
- Cascadas ON DELETE/UPDATE

**3.7 Contenido del sitio**
Tabla para administrar el contenido dinámico de la landing page y secciones informativas.

| **Columna**   | **Tipo**                                   |
| ------------- | ------------------------------------------ |
| id            | UUID PRIMARY KEY DEFAULT gen_random_uuid() |
| page          | site_page_type NOT NULL                    |
| section_key   | TEXT NOT NULL                              |
| title         | TEXT                                       |
| description   | TEXT                                       |
| image_url     | TEXT                                       |
| content_order | INTEGER DEFAULT 0                          |
| is_active     | BOOLEAN DEFAULT true                       |
| metadata      | JSONB DEFAULT '{}'::jsonb                  |
| created_at    | TIMESTAMPTZ DEFAULT now()                  |
| updated_at    | TIMESTAMPTZ DEFAULT now()                  |

**U compuesta**

- (page, section_key)

**3.8 Codigos de paises**

CRUD tabla de códigos de países para anexar a números de teléfono.

| **Columna**             | **Tipo**    | **Descripción**             |
| ----------------------- | ----------- | --------------------------- |
| id                      | bigint (PK) | Identificador único         |
| iso2                    | character   | Código de 2 letras (unique) |
| iso3                    | character   | Código de 3 letras (unique) |
| name                    | text        | Nombre del país             |
| phone_code              | text        | Prefijo telefónico          |
| flag_emoji              | text        | Emoji de la bandera         |
| created_at / updated_at | timestamptz | Auditoría                   |

RLS habilitado.

**3.9 users, roles, user_companies**

Modelo de seguridad y acceso.

- users: perfil extendido vinculado a auth.users
- roles: catálogo de roles (admin, reader, admin_empresa, ventas, etc.)
- user_companies: relación usuario-empresa-rol

Incluye:

- Sincronización automática role ↔ role_id
- RLS estricto (solo admin global puede escribir roles)
- Cascadas controladas

**3.10 user_activity_log**

Bitácora de auditoría funcional.

| **Columna** | **Tipo**    |
| ----------- | ----------- |
| id          | uuid        |
| user_id     | uuid        |
| action      | text        |
| entity      | text        |
| entity_id   | uuid        |
| metadata    | jsonb       |
| timestamp   | timestamptz |

Políticas:

- Insertar solo actividad propia
- Lectura propia o admin/reader global

**4. Views**

**v_students_with_counts**

Vista agregada de alumnos con número de cartones asignados.

- LEFT JOIN con students_cards
- Campo calculado assigned_cards_calc
- Uso típico: reporting / dashboards

**5. Funciones relevantes**

**Funciones de seguridad (SECURITY DEFINER)**

- is_admin_global()
- is_reader_global()
- is_global_role(text)
- is_global_admin()

Uso:

- Centralizan lógica de autorización
- Utilizadas extensivamente en políticas RLS
- search_path controlado (hardening)

**Funciones de negocio**

- log_user_activity(...)
- role_id_by_name(text)
- sync_user_companies_role()
- set_timestamps()

**6. Triggers**

| **Trigger**                      | **Tabla**      | **Propósito**             |
| -------------------------------- | -------------- | ------------------------- |
| set_timestamps                   | Todas          | Auditoría temporal        |
| trg_cards_validate_invoice_event | cards          | Integridad factura-evento |
| trg_user_companies_sync_role     | user_companies | Consistencia rol/role_id  |

**7. Seguridad y RLS (resumen ejecutivo)**

- ✅ RLS habilitado en todas las tablas sensibles
- ✅ Acceso por:
  - Rol global (admin / reader)
  - Pertenencia a empresa (user_companies)

- ✅ service_role reservado para backend
- ⚠️ Riesgo documentado: DEFAULT PRIVILEGES de supabase_admin (ver informe de auditoría)

**8. Valor arquitectónico del diseño**

- Modelo **escalable multi‑empresa**
- Separación clara entre **identidad (auth)** y **dominio**
- Alta trazabilidad y auditabilidad
- Compatible con BI / reporting
- Cumple buenas prácticas Supabase + PostgreSQL

**✅ Conclusión ejecutiva**

Este esquema constituye una **base de datos madura, segura y lista para producción**, con controles de integridad y acceso bien definidos.  
La única consideración relevante queda **documentada y mitigable** (default privileges), sin afectar el diseño funcional ni la seguridad actual.

erDiagram

  companies ||--o{ events : has

  events ||--o{ cards : contains

  events ||--o{ students : includes

  students ||--o{ students_cards : assigned

  cards ||--o{ students_cards : linked

  companies ||--o{ user_companies : employs

  users ||--o{ user_companies : belongs

## Datos para conexión a Supabase

### 1. Proyecto id: Bingo La Rioja 2026

Url del proyecto : https://wfkqsifhxnarmxrvbgiu.supabase.co

Clave publicable : sb_publishable_YEtWPWfa0PJ49U9NiJhBTw_H40qXXzL

Cadena de conexión directa: postgresql://postgres:\[YOUR-PASSWORD]@db.wfkqsifhxnarmxrvbgiu.supabase.co:5432/postgres

Comando de configuración de la CLI: supabase login

supabase init

supabase link --project-ref wfkqsifhxnarmxrvbgiu

### 2. env.local

NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN

## Script SQL creado por Windsurf cascade para crear tabla site_content

sql
-- 1. Crear tipo enumerado para las páginas (opcional, pero recomendado para consistencia)
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'site_page_type') THEN
CREATE TYPE site_page_type AS ENUM ('home', 'about', 'contact', 'global', 'social media', 'whatsapp message');
END IF;
END $$;

-- 2. Crear la tabla de contenido dinámico
CREATE TABLE IF NOT EXISTS public.site_content (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
page site_page_type NOT NULL,
section_key TEXT NOT NULL, -- Ej: 'hero_section', 'mision_vission', 'footer_info'
title TEXT,
description TEXT,
image_url TEXT, -- URL de la imagen en Supabase Storage
content_order INTEGER DEFAULT 0,
is_active BOOLEAN DEFAULT true,
metadata JSONB DEFAULT '{}'::jsonb, -- Para configuraciones extra (colores, alineación, etc.)
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unicidad para evitar duplicar secciones en una misma página
    CONSTRAINT unique_page_section UNIQUE (page, section_key)

);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas de Acceso

-- Política: Lectura pública para contenido activo
CREATE POLICY "Permitir lectura pública de contenido activo"
ON public.site_content
FOR SELECT
USING (is_active = true);

-- Política: Los administradores globales pueden hacer todo (CRUD completo)
-- Nota: Utilizamos la función is_admin_global() que ya existe en tu esquema
CREATE POLICY "Admins globales tienen control total sobre contenido"
ON public.site_content
FOR ALL
TO authenticated
USING (is_admin_global())
WITH CHECK (is_admin_global());

-- 5. Crear Trigger para actualizar 'updated_at' automáticamente
-- Nota: Si ya tienes la función set_timestamps() creada (como indica tu documento), la reutilizamos
CREATE TRIGGER trg_site_content_set_timestamps
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();

-- 6. Comentarios de Auditoría para el DBA
COMMENT ON TABLE public.site_content IS 'Tabla para administrar el contenido dinámico de la landing page y secciones informativas.';
COMMENT ON COLUMN public.site_content.section_key IS 'Identificador único por sección de página para facilitar la consulta desde el frontend.';
Notas sobre el diseño:
Integración con Roles: He configurado la política de escritura para que use la función is_admin_global(). Esto asegura que solo las personas con los privilegios que ya definiste en el sistema de Bingo puedan modificar la web.
section_key: Este campo es vital. En el código de Next.js, consultaremos esta tabla filtrando por page y section_key para obtener el texto e imagen exactos de cada parte de la UI.
metadata: He incluido un campo JSONB. Esto es útil por si en el futuro quieres añadir pequeños detalles dinámicos (como el texto de un botón o un color de fondo específico) sin tener que cambiar la estructura de la tabla.
image_url: Aquí guardaremos el path del archivo que subas al bucket de Supabase Storage.
