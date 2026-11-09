# Módulo de Seguridad — Filosofía, Fundamentos y Referencia Técnica

**Versión del documento:** 2.0.0  
**Fecha:** noviembre de 2026  
**Aplica a:** La Rioja — Centro de Formación Laboral (backoffice `/admin`)

---

## 1. Filosofía y principios de diseño

### 1.1 Sistema de autorización unificado

El sistema utiliza **una sola capa de autorización** basada en el módulo de seguridad avanzado (`sec_*`). El sistema de roles legado (`roles`, `users.role_id`) fue eliminado completamente en noviembre de 2026.

| Capa | Sistema | Almacenamiento | Momento de verificación |
| :--- | :------ | :------------- | :---------------------- |
| **Avanzado** | Máscara de bits por opción y recurso (`sec_permissions`) + snapshot en JWT | JWT claim `app_authz` + snapshot en memoria | Proxy (edge), layout server, Server Action, Route Handler |
| **Base legado** (compatibilidad) | Nivel derivado de `sec_user_roles` → nivel numérico equivalente | `sec_user_roles` + `sec_roles.is_super_admin` via Admin client | Server Actions / Route Handlers (run-time) |

La capa "Base legado" es un adaptador que permite que las ~50 llamadas a `withRole(N, fn)` y `requireRoleLevel(N)` distribuidas en toda la app sigan funcionando sin refactorización masiva. Internamente ya consultan `sec_user_roles` —no la tabla `roles` eliminada. La migración completa a `requirePermission(optionCode, table, action)` se realizará progresivamente.

### 1.2 Principio de menor privilegio

- Por defecto un usuario sin asignación en `sec_user_roles` **no tiene acceso a nada** dentro del módulo avanzado.
- El SuperAdmin (`sec_roles.is_super_admin = true`) es la única excepción: todas las funciones de verificación retornan `true` para él sin consultar la tabla de permisos.
- Los permisos se otorgan de forma explícita opción a opción y recurso a recurso.

### 1.3 Capas de control

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROXY (src/proxy.ts)  — edge, antes de Next.js                     │
│  · Refresca sesión Supabase                                          │
│  · Redirige /admin/* si sin sesión → /login                         │
│  · Redirige si sin empresa seleccionada → /auth/select-company      │
│  · Verifica app_authz del JWT: si presente y vacío → /acceso-denegado│
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  ADMIN LAYOUT (src/app/admin/layout.tsx)                            │
│  · getSessionAuthz() → snapshot de permisos                         │
│  · PermissionProvider → distribuye snapshot a toda la subtree       │
│  · PermissionProvider → suscripción Realtime a sec_authz_version   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  PAGE / LAYOUT del módulo (Server Component)                        │
│  · requireOption("OPCION_CODE") — redirige si sin permiso READ      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  COMPONENTES DE INTERFAZ (Client Components)                        │
│  · usePermission("OPCION_CODE") → { canView, can(action, table) }  │
│  · <Can option="..." action="..."> ... </Can>                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  ROUTE HANDLERS / SERVER ACTIONS                                    │
│  · checkAdmin(companyId, minLevel) — capa legado                    │
│  · requirePermission("OPCION_CODE", "tabla", action) — capa avanzada│
│  · withRole(minLevel, fn) / withCompanyAccess(fn) — HOF legado      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.4 Máscara de bits (actions_mask)

Los permisos se codifican en un entero de 8 bits. Cada acción ocupa un bit:

| Bit | Valor | Acción | Descripción |
| :-- | :---- | :----- | :---------- |
| 0 | 1 | `READ` | Ver/listar la opción o recurso |
| 1 | 2 | `WRITE` | Crear registros |
| 2 | 4 | `UPDATE` | Editar registros |
| 3 | 8 | `DELETE` | Eliminar registros |
| 4 | 16 | `PRINT` | Imprimir / generar PDF |
| 5 | 32 | `DOWNLOAD` | Exportar / descargar |
| 6 | 64 | `UPLOAD` | Importar / cargar archivos |
| 7 | 128 | `EXECUTE` | Ejecutar operaciones especiales |
| — | 255 | `ALL` | Todas las acciones (SuperAdmin) |

**Ejemplo:** `mask = 7` (READ + WRITE + UPDATE = 1+2+4) significa que el rol puede ver, crear y editar, pero no borrar, imprimir, ni exportar.

La verificación se hace con una operación AND: `(mask & bit) === bit`.

---

## 2. Flujo completo: desde el login hasta la verificación de opciones

### 2.1 Login y emisión del JWT

```
Usuario ingresa credenciales
        │
        ▼
Supabase Auth (email/password o Google OAuth)
        │
        ▼
Supabase JWT Hook (function: custom_access_token_hook)
        │  Lee sec_user_roles del usuario (roles activos, no expirados)
        │  Lee sec_permissions de esos roles
        │  Construye el claim app_authz = { v, sa, ma, o }
        ▼
JWT firmado con app_authz en el access token
        │
        ▼
Cliente recibe el token (cookie sb-... gestionada por @supabase/ssr)
```

**Estructura del claim `app_authz` en el JWT:**

```json
{
  "app_authz": {
    "v": 42,           // versión del snapshot (incrementa cuando cambian los permisos)
    "sa": false,       // ¿es SuperAdmin?
    "ma": ["CONFIG"],  // módulos que administra (para mostrar el sidebar)
    "o": {             // máscara por código de opción
      "DASH_HOME":     1,
      "CFG_USERS_ROLES": 255,
      "BINGO_EVENTS":  63
    }
  }
}
```

### 2.2 Verificación en el Proxy (edge)

El proxy (`src/proxy.ts`) es el primer punto de control:

1. Extrae el JWT del access_token de la cookie.
2. Decodifica el payload (base64url → JSON) **sin verificar firma** (es edge, no tiene clave privada).
3. Si `app_authz` está presente (el hook está activo) Y `sa=false` Y `o={}` Y `ma=[]` → redirige a `/acceso-denegado`.
4. Si `app_authz` está ausente (hook no configurado) → omite el check graciosamente.
5. No verifica permisos granulares (eso lo hace el layout): solo bloquea usuarios sin ningún acceso.

> **Rutas excluidas del check del proxy:** `/admin/profile` (para permitir logout aun siendo bloqueado).

### 2.3 Resolución del snapshot en el layout admin

`getSessionAuthz()` en `src/lib/security/server.ts` (con `React.cache` para una sola resolución por petición):

1. Llama `supabase.auth.getClaims()` → extrae `claims.sub` (userId) y `app_authz.v` (versión).
2. Busca `{userId}:{v}` en el **LRU en memoria** (TTL 5 min, máx. 500 entradas).
3. Si hay hit → retorna el snapshot cacheado (sin BD).
4. Si no → llama al RPC `get_my_permissions()` que devuelve `PermissionSnapshot` completo (incluye el mapa de recursos `r`).
5. Guarda en LRU y retorna.

El snapshot completo tiene **dos mapas adicionales** sobre `app_authz`:
- `r`: permisos a nivel de **recurso** (tabla) → clave `"OPCION_CODE:tabla"` → máscara.

### 2.4 Distribución en cliente con PermissionProvider

`PermissionProvider` (en `src/lib/security/permission-context.tsx`):
- Recibe el snapshot desde el layout server y lo coloca en Context.
- Suscribe a Realtime en la tabla `sec_authz_version` filtrando por `user_id`.
- Cuando hay un cambio (alguien modificó los permisos del usuario): refresca el JWT con `supabase.auth.refreshSession()` y llama `router.refresh()` para que el server component resuelva de nuevo el snapshot. **El cliente nunca queda con permisos obsoletos.**

### 2.5 Verificación en componentes de interfaz

```tsx
const { canView, can, isSuperAdmin } = usePermission("CFG_USERS_ROLES");

// Mostrar o no un botón:
{can("WRITE") && <Button>Nuevo Usuario</Button>}

// Renderizar bloque condicional:
<Can option="CFG_USERS_ROLES" action="DELETE">
  <DeleteButton />
</Can>

// Verificar recurso específico (tabla):
{can("UPDATE", "users") && <EditButton />}
```

### 2.6 Verificación en Server Actions y Route Handlers

```typescript
// Guard avanzado — lanza ForbiddenError si falla:
await requirePermission("CFG_USERS_ROLES", "users", "DELETE");

// Guard legado — retorna { error } si falla:
const { error } = await requireRoleLevel(8);
if (error) return { success: false, error };

// Guard combinado en Route Handlers:
const result = await checkAdmin(companyId, 4);
if ('error' in result) return Response.json({ error: result.error }, { status: result.status });
```

### 2.7 Visibilidad del menú sidebar

El sidebar (`AdminSidebar.tsx`) utiliza el sub-componente `SidebarNavLink` para **ocultar automáticamente** las opciones a las que el usuario no tiene acceso. El filtrado opera en cliente con costo cero porque los datos ya están en el `PermissionProvider`.

**Mapeo optionCode → entrada del menú**

| Entrada | `optionCode` | Comportamiento |
| :------ | :----------- | :------------- |
| Dashboard | `DASH_HOME` | Oculto si no tiene READ |
| Gestión CMS | `CMS_CONTENT` | Oculto si no tiene READ |
| Gestión Productos | `SHOP_PRODUCTS` | Oculto si no tiene READ |
| Gestión Bingo | `BINGO_EVENTS` | Oculto si no tiene READ |
| Configuración | _(ninguno)_ | Siempre visible; guards por sub-página |
| Galería | _(ninguno)_ | Siempre visible (enlace externo público) |

**Lógica de `SidebarNavLink`**

```tsx
const { canView, isSuperAdmin, hasSnapshot } = usePermission(link.optionCode ?? "_none_");
// Sin optionCode            → siempre visible (Configuración, Galería).
// Sin snapshot (solo legacy)→ siempre visible; el guard de la página protege.
// Con optionCode + snapshot → ocultar si !canView y !isSuperAdmin.
if (link.optionCode && hasSnapshot && !isSuperAdmin && !canView) return null;
```

- **`hasSnapshot`**: `true` solo cuando el usuario tiene al menos un rol asignado en `sec_user_roles`. Usuarios que únicamente usan el sistema legacy (nivel de rol numérico) ven el sidebar completo — la protección real recae en el guard de la página.
- **Super Admin** (`sa: true` en el JWT) siempre ve todos los ítems.
- El componente se usa tanto en el sidebar desktop como en el sidebar móvil (prop `mobile`).

---

## 3. Componentes del núcleo (core)

### 3.1 `src/lib/security/types.ts`

Tipos y funciones puras compartidas entre servidor, proxy y cliente. No importa nada de Next.js ni Supabase.

| Exportación | Tipo | Descripción |
| :---------- | :--- | :---------- |
| `ACTION_BITS` | `const` | Mapa `Action → número de bit` |
| `Action` | `type` | Unión de acciones válidas |
| `AuthzClaims` | `interface` | Claim compacto en el JWT (`v, sa, ma, o`) |
| `PermissionSnapshot` | `interface` | Extiende `AuthzClaims` con el mapa de recursos `r` |
| `hasBits(mask, action)` | `function` | Verifica si una máscara tiene el bit de acción |
| `canOption(claims, code, action)` | `function` | Nivel 2: ¿puede abrir/usar la opción? |
| `canResource(snap, code, table, action)` | `function` | Nivel 3: ¿puede operar sobre la tabla en la opción? |
| `canModule(claims, moduleCode, optionCodes)` | `function` | Nivel 1: ¿el módulo es visible? |

### 3.2 `src/lib/security/server.ts`

Solo servidor (`import "server-only"`). Gestión del snapshot y guards de página.

| Exportación | Descripción |
| :---------- | :---------- |
| `getSessionAuthz()` | Resuelve el snapshot; LRU en memoria + React.cache |
| `requireOption(code, action?)` | Guard de page/layout; redirige si no tiene permiso |
| `requirePermission(code, table, action)` | Guard de Server Action/Route Handler; lanza `ForbiddenError` |
| `ForbiddenError` | Clase de error para rechazos de permiso |

### 3.3 `src/lib/security/permission-context.tsx`

Solo cliente (`"use client"`). Distribución reactiva del snapshot.

| Exportación | Descripción |
| :---------- | :---------- |
| `PermissionProvider` | Provider; recibe snapshot del server; suscripción Realtime |
| `usePermission(optionCode)` | Hook; devuelve `{ canView, can, isSuperAdmin }` |
| `Can` | Componente declarativo de control de visibilidad |

### 3.4 `src/lib/security/routes.generated.ts`

Mapeo de rutas a opciones de seguridad. Mantenido a mano hasta que el módulo esté completamente activo en producción.

| Exportación | Descripción |
| :---------- | :---------- |
| `SECURED_ROUTES` | Array de `{ prefix, option, module }` ordenado de más específico a más general |
| `PUBLIC_PREFIXES` | Rutas accesibles sin sesión |
| `AUTHENTICATED_ONLY` | Rutas que requieren sesión pero sin opción sec_* asignada |
| `matchRoute(path)` | Retorna el `SecuredRoute` que corresponde a la ruta |

### 3.5 `src/lib/auth/authorization.ts` (adaptador de compatibilidad)

| Exportación | Descripción |
| :---------- | :---------- |
| `requireRoleLevel(minLevel)` | Verifica nivel equivalente consultando `sec_user_roles`. Nivel 10 = `is_super_admin`, nivel 8 = cualquier rol activo, nivel 0 = solo autenticado |
| `requireCompanyAccess(companyId)` | Verifica membresía en la empresa (consulta `user_companies`, sin FK a `roles`) |

> **Nota:** `roleLevelOf()` fue eliminado en v2.0.0 junto con la tabla `roles`. Todo código que necesite el nivel del usuario debe usar `requireRoleLevel()` directamente.

### 3.6 `src/lib/auth/guards.ts` (adaptador de compatibilidad)

| Exportación | Descripción |
| :---------- | :---------- |
| `withRole(minLevel, fn)` | HOF que protege Server Actions por nivel de rol |
| `withCompanyAccess(fn, index?)` | HOF que protege Server Actions por membresía de empresa |

---

## 4. Tablas de base de datos

### 4.1 Tablas del módulo de seguridad avanzado (`sec_*`)

#### Tabla: `public.sec_roles`

**Descripción:** Catálogo de roles del módulo de seguridad avanzado. Cada rol agrupa un conjunto de permisos que se asignan a usuarios.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `id` | `uuid` | NO | Identificador único del rol (PK). |
| `code` | `text` | NO | Código único en MAYÚSCULAS (ej: `ADMIN`, `VENTAS`). UNIQUE. |
| `name` | `text` | NO | Nombre legible del rol. |
| `description` | `text` | SÍ | Descripción de responsabilidades. |
| `is_super_admin` | `boolean` | NO | Si `true`, el portador tiene acceso total a todo. Default `false`. |
| `is_system` | `boolean` | NO | Rol creado por el sistema; no se puede eliminar. Default `false`. |
| `is_active` | `boolean` | NO | Estado activo/inactivo. Default `true`. |
| `created_at` | `timestamptz` | NO | Fecha de creación. |
| `updated_at` | `timestamptz` | NO | Fecha de última modificación. |

**Notas:** Solo los usuarios con nivel de rol ≥ 9 pueden crear/modificar roles de seguridad.

---

#### Tabla: `public.sec_modules`

**Descripción:** Módulos funcionales de la aplicación (grupos de opciones). Corresponden a las secciones del menú principal.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `id` | `uuid` | NO | Identificador único del módulo (PK). |
| `code` | `text` | NO | Código único en MAYÚSCULAS (ej: `BINGO`, `CONFIG`, `CMS`). UNIQUE. |
| `name` | `text` | NO | Nombre legible (ej: `Gestión Bingo`). |
| `icon` | `text` | SÍ | Nombre del ícono (lucide-react). |
| `order_index` | `integer` | NO | Orden de aparición en el menú. |
| `is_active` | `boolean` | NO | Módulo activo en el sistema. Default `true`. |
| `created_at` | `timestamptz` | NO | Fecha de creación. |

---

#### Tabla: `public.sec_options`

**Descripción:** Opciones (pantallas/rutas) dentro de un módulo. Cada opción corresponde a un prefijo de ruta del sistema y se protege por separado.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `id` | `uuid` | NO | Identificador único de la opción (PK). |
| `module_id` | `uuid` | NO | Módulo al que pertenece (FK → `sec_modules.id`). |
| `code` | `text` | NO | Código único en MAYÚSCULAS (ej: `CFG_USERS_ROLES`, `BINGO_EVENTS`). UNIQUE. |
| `name` | `text` | NO | Nombre legible (ej: `Usuarios y Roles`). |
| `path_route` | `text` | SÍ | Prefijo de ruta que protege (ej: `/admin/settings/users`). |
| `order_index` | `integer` | NO | Orden dentro del módulo. |
| `is_active` | `boolean` | NO | Opción activa. Default `true`. |
| `created_at` | `timestamptz` | NO | Fecha de creación. |

**Catálogo de opciones configuradas:**

| Código | Ruta protegida | Módulo |
| :----- | :------------- | :----- |
| `DASH_HOME` | `/admin` | DASHBOARD |
| `CMS_CONTENT` | `/admin/cms` | CMS |
| `SHOP_PRODUCTS` | `/admin/productos` | SHOP |
| `BINGO_EVENTS` | `/admin/bingo` | BINGO |
| `CFG_USERS_ROLES` | `/admin/settings/users` | CONFIG |
| `CFG_AUDIT` | `/admin/settings/logs` | CONFIG |
| `CFG_COMPANIES` | `/admin/settings/companies` | CONFIG |
| `CFG_COUNTRY_CODES` | `/admin/settings/countries` | CONFIG |
| `CFG_STUDENTS` | `/admin/settings/students` | CONFIG |
| `CFG_CONTACT_MSGS` | `/admin/settings/contact` | CONFIG |
| `CFG_REG_LIMITS` | `/admin/settings/registration-limits` | CONFIG |
| `CFG_TEST_DATA` | `/admin/settings/test-data` | CONFIG |

---

#### Tabla: `public.sec_resources`

**Descripción:** Recursos (tablas de base de datos) asociados a una opción. Permite control granular de acciones sobre entidades específicas dentro de una misma pantalla.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `id` | `uuid` | NO | Identificador único del recurso (PK). |
| `option_id` | `uuid` | NO | Opción a la que pertenece (FK → `sec_options.id`). |
| `table_name` | `text` | NO | Nombre de la tabla en la BD (ej: `users`, `roles`). |
| `display_name` | `text` | NO | Nombre legible en la UI (ej: `Usuarios`, `Roles`). |
| `created_at` | `timestamptz` | NO | Fecha de creación. |

---

#### Tabla: `public.sec_permissions`

**Descripción:** Permisos asignados a un rol: qué acciones puede ejecutar sobre una opción y/o recurso. Es la tabla central del módulo.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `role_id` | `uuid` | NO | Rol al que se asigna el permiso (PK parcial, FK → `sec_roles.id`). |
| `option_id` | `uuid` | NO | Opción sobre la que aplica el permiso (PK parcial, FK → `sec_options.id`). |
| `resource_id` | `uuid` | SÍ | Recurso específico dentro de la opción (PK parcial, FK → `sec_resources.id`). `NULL` = permiso de nivel opción. |
| `actions_mask` | `integer` | NO | Máscara de bits de acciones permitidas (ver §1.4). |

**Clave primaria:** `(role_id, option_id, resource_id)`. Si `resource_id` es `NULL`, el registro controla el acceso a nivel de opción completa.

**Lógica de evaluación:**
- Si `resource_id IS NULL`: controla si el usuario puede abrir/operar la pantalla entera.
- Si `resource_id IS NOT NULL`: controla acciones específicas sobre esa tabla (READ, WRITE, UPDATE, DELETE, PRINT, DOWNLOAD, UPLOAD, EXECUTE).

---

#### Tabla: `public.sec_user_roles`

**Descripción:** Asignación de roles de seguridad a usuarios. Permite vigencia temporal (válido desde/hasta).

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `id` | `uuid` | NO | Identificador único de la asignación (PK). |
| `user_id` | `uuid` | NO | Usuario al que se asigna el rol (FK → `auth.users.id`). |
| `role_id` | `uuid` | NO | Rol asignado (FK → `sec_roles.id`). |
| `valid_from` | `timestamptz` | NO | Fecha de inicio de vigencia. |
| `valid_to` | `timestamptz` | SÍ | Fecha de fin de vigencia (`NULL` = sin expiración). |
| `is_active` | `boolean` | NO | Si `false`, la asignación está desactivada manualmente. Default `true`. |
| `created_at` | `timestamptz` | NO | Fecha de creación. |
| `updated_at` | `timestamptz` | NO | Fecha de última modificación. |

**Vigencia activa:** `is_active = true AND valid_from <= NOW() AND (valid_to IS NULL OR valid_to > NOW())`.

---

#### Tabla: `public.sec_authz_version`

**Descripción:** Control de versión de permisos por usuario. El JWT Hook incrementa la versión cada vez que cambian los permisos del usuario. El cliente React suscrito a esta tabla detecta el cambio y refresca el JWT automáticamente.

| Columna | Tipo | Nulo | Descripción |
| :------ | :--- | :--- | :---------- |
| `user_id` | `uuid` | NO | Usuario afectado (PK, FK → `auth.users.id`). |
| `version` | `integer` | NO | Número de versión actual (incrementa con cada cambio de permisos). |
| `updated_at` | `timestamptz` | NO | Momento del último cambio. |

**Uso:** El `PermissionProvider` suscribe a `postgres_changes` sobre esta tabla filtrando por `user_id=eq.{userId}`. Cuando llega un cambio, llama `supabase.auth.refreshSession()` para que Supabase emita un nuevo JWT con la versión actualizada, y luego `router.refresh()` para que el Server Component cargue el nuevo snapshot.

---

### 4.2 Tablas de identidad y autorización base (`public`)

| Tabla | Descripción | Rol en seguridad |
| :---- | :---------- | :--------------- |
| `users` | Perfil del usuario | Origen de `auth.users.id`; ya **no** contiene `role_id` (eliminado en v2.0.0) |
| `user_companies` | Membresía usuario-empresa | Base de `requireCompanyAccess()` y del filtrado RLS multi-tenant |
| `user_activity_log` | Bitácora de auditoría | Registro de acciones administrativas |

> **Tablas eliminadas en v2.0.0:** `public.roles` (catálogo de roles legado), columnas `users.role_id` y `user_companies.role_id`. Ver migración `supabase/migrations/20261107000001_remove_legacy_roles.sql`.

### 4.3 RPC de permisos

#### `get_my_permissions()` → `PermissionSnapshot`

Función PostgreSQL `SECURITY DEFINER` que resuelve el snapshot completo del usuario autenticado:

1. Obtiene los `role_id` activos de `sec_user_roles` para `auth.uid()`.
2. Consulta `sec_permissions` JOIN `sec_options` para construir el mapa `o` (por código de opción).
3. Consulta `sec_permissions` JOIN `sec_options` JOIN `sec_resources` para construir el mapa `r` (clave `"OPCION_CODE:tabla"`).
4. Detecta si algún rol tiene `is_super_admin = true`.
5. Retorna el JSON con `{ v, sa, ma, o, r }`.

---

## 5. Consideraciones Supabase y Vercel

### 5.1 JWT Hook (Supabase)

El claim `app_authz` se inyecta en el token mediante un **Custom JWT Hook** configurado en Supabase Auth:

- **Función:** `custom_access_token_hook` (PostgreSQL, `SECURITY DEFINER`).
- **Trigger:** se llama cada vez que Supabase emite o refresca un JWT.
- **Si el hook no está configurado:** `app_authz` estará ausente del token. El proxy y el sistema avanzado lo detectan y degradan al sistema legado **sin romper el acceso**.
- **Tiempo de expiración del JWT:** Supabase por defecto emite tokens de 1 hora. El cliente refresca automáticamente con `@supabase/ssr` antes de que expiren.

### 5.2 LRU en servidor Next.js (Vercel)

`snapshotCache` en `server.ts` es un `Map` en memoria del proceso Node.js:
- **En desarrollo:** hay un único proceso; funciona como se espera.
- **En Vercel (producción):** Vercel puede tener múltiples instancias. El LRU **no se comparte** entre instancias. Si el permiso cambia y el usuario cae en otra instancia, puede servir el snapshot anterior durante hasta 5 minutos (TTL).
- **Solución para invalidación inmediata:** la suscripción Realtime a `sec_authz_version` en el cliente fuerza el refresco del JWT, lo que cambia la clave del LRU (`userId:v`) y garantiza que la siguiente petición cargue el snapshot nuevo desde la BD.

### 5.3 Cookies y sesión multi-dominio

- El dominio canónico es `lariojacflsv.site`. Las cookies `sb-...` de Supabase se fijan en ese dominio.
- `www.lariojacflsv.site` redirige con 308 al dominio canónico (ver proxy).
- La cookie `selected_company_id` es obligatoria para acceder a `/admin`. Se establece en `/auth/select-company` al inicio de sesión.

### 5.4 `SUPABASE_SERVICE_ROLE_KEY` en Vercel

- Se usa exclusivamente a través de `createAdminClient()` en Route Handlers y Server Actions de servidor.
- **Nunca** debe estar disponible en componentes de cliente ni en variables `NEXT_PUBLIC_`.
- En Vercel: configurar como **Environment Variable cifrada** sin el prefijo `NEXT_PUBLIC_`.

### 5.5 Row Level Security (RLS)

#### 5.5.1 ¿Las RLS son dinámicas o se fijan por usuario?

**Las políticas RLS son completamente dinámicas**: PostgreSQL las evalúa en **cada consulta SQL**, en tiempo real, usando el contexto de sesión del momento. No se "calculan" ni se "fijan" en el momento del login; se recalculan cada vez que se ejecuta un `SELECT`, `INSERT`, `UPDATE` o `DELETE`.

Esto significa:

- Cuando el JWT del usuario cambia (por ejemplo, después de que se actualiza su versión de permisos y llama a `supabase.auth.refreshSession()`), la siguiente consulta ya opera con el JWT nuevo.
- Si un administrador revoca el acceso a un usuario a las 14:00, ese usuario puede seguir usando el JWT anterior hasta que expire (máximo 1 hora en Supabase), pero cualquier consulta directa a PostgREST/browser ya refleja el cambio de inmediato, pues la función `auth.uid()` y `auth.jwt()` leen del token activo en la conexión.

#### 5.5.2 Cómo funciona `auth.uid()` y `auth.jwt()` en PostgreSQL

Cuando el cliente de Supabase (browser o server) realiza una petición a PostgREST, incluye el JWT en el header `Authorization`. PostgREST establece una sesión de PostgreSQL y llama internamente a:

```sql
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{ "sub": "uuid-del-usuario", "app_authz": {...}, ... }';
```

A partir de ese momento, en esa sesión de base de datos:

- `auth.uid()` → retorna el `sub` del JWT (UUID del usuario).
- `auth.jwt()` → retorna el JSON completo del JWT como `jsonb`.
- `auth.jwt() -> 'app_authz'` → retorna el claim de autorización del módulo avanzado.

Cada `USING (...)` y `WITH CHECK (...)` de las políticas RLS puede invocar estas funciones. Como se re-ejecutan por consulta y leen del estado de la sesión actual, reflejan siempre el token presente.

#### 5.5.3 Patrón de las tablas de negocio (multi-tenant)

Las tablas de negocio (`bingo_events`, `bingo_cards`, `invoices`, etc.) usan un patrón de RLS basado en membresía de empresa:

```sql
-- Ejemplo típico de política multi-tenant
CREATE POLICY "company_access" ON bingo_events
  FOR ALL TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );
```

Este patrón garantiza que un usuario solo vea los datos de las empresas a las que pertenece, **evaluado dinámicamente** en cada consulta usando `auth.uid()`.

#### 5.5.4 Políticas RLS de las tablas `sec_*`

Todas las tablas del módulo de seguridad avanzado tienen RLS habilitado. La lógica de acceso es la siguiente:

| Tabla | Política de lectura | Política de escritura | Notas |
| :---- | :------------------ | :-------------------- | :---- |
| `sec_roles` | Todos los usuarios autenticados | Solo SuperAdmin (`is_super_admin = true` en `sec_user_roles`) | Acceso admin vía `createAdminClient()` |
| `sec_modules` | Todos los usuarios autenticados | Solo SuperAdmin | — |
| `sec_options` | Todos los usuarios autenticados | Solo SuperAdmin | — |
| `sec_resources` | Todos los usuarios autenticados | Solo SuperAdmin | — |
| `sec_permissions` | Todos los usuarios autenticados | Solo nivel ≥ 9 en `sec_user_roles` | — |
| `sec_user_roles` | Propio usuario o nivel ≥ 9 | Solo nivel ≥ 9 | — |
| `sec_authz_version` | Propio usuario (`user_id = auth.uid()`) | Solo función hook (`SECURITY DEFINER`) | Trigger `on_authz_change` |

#### 5.5.5 El problema de recursión en RLS y `SECURITY DEFINER`

Una trampa clásica al proteger tablas de autorización con RLS es la recursión infinita: si la política `USING` de una tabla hace un `JOIN` con sí misma o con otra tabla también protegida, PostgreSQL entra en un bucle (error `42P17`).

> **Nota histórica:** En el sistema legado existía `public.is_superadmin()` —una función `SECURITY DEFINER` que consultaba `users JOIN roles` para verificar si el usuario tenía nivel 10. Fue eliminada en v2.0.0 junto con la tabla `roles`.

El patrón `SECURITY DEFINER` sigue siendo relevante para las tablas `sec_*`. Si una política de `sec_roles` necesita consultar `sec_user_roles` (que a su vez protege por `sec_roles`), el ciclo se rompe usando una función auxiliar:

```sql
-- Ejemplo para tablas sec_* si se requiriera recursión:
CREATE OR REPLACE FUNCTION public.is_sec_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER        -- Se ejecuta con privilegios del propietario (postgres)
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sec_user_roles sur
    JOIN sec_roles sr ON sr.id = sur.role_id
    WHERE sur.user_id = auth.uid()
      AND sur.is_active = true
      AND sr.is_super_admin = true
      AND (sur.valid_to IS NULL OR sur.valid_to > NOW())
  );
$$;
```

**¿Por qué funciona?** `SECURITY DEFINER` hace que la función se ejecute con los permisos del usuario que la *creó* (normalmente `postgres`/propietario del esquema). Las políticas RLS de las tablas consultadas dentro de ella no se aplican en ese contexto, rompiendo el ciclo recursivo.

En la práctica, el sistema actual evita la recursión porque `createAdminClient()` (con `service_role`, BYPASSRLS) se usa para todas las consultas internas a las tablas `sec_*`. Las políticas RLS solo protegen el acceso directo externo (PostgREST / browser con clave anónima).

#### 5.5.6 `createAdminClient()` y el bypass de RLS

Las operaciones internas del sistema (Server Actions, Route Handlers) **nunca** usan el cliente de Supabase del usuario para acceder a las tablas de seguridad. En su lugar, utilizan `createAdminClient()`:

```typescript
// src/lib/supabase/server.ts
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // service_role
  );
}
```

La clave `service_role` hace que PostgreSQL establezca la sesión con `SET LOCAL role = 'service_role'`. Este rol tiene el privilegio `BYPASSRLS` en Supabase, lo que significa que **todas las políticas RLS se ignoran por completo** para ese cliente.

Esto permite al sistema leer y escribir en las tablas `sec_*` sin las restricciones que protegen el acceso directo externo. El aislamiento de seguridad viene del hecho de que esta clave es un **secreto de servidor** (`SUPABASE_SERVICE_ROLE_KEY`, sin prefijo `NEXT_PUBLIC_`) que nunca llega al browser.

> **Regla crítica:** `createAdminClient()` solo puede usarse en código de servidor (Server Components, Server Actions, Route Handlers). Usarlo en un componente `"use client"` o exponerlo vía una variable de entorno `NEXT_PUBLIC_` comprometería completamente la seguridad del sistema.

#### 5.5.7 Supabase Realtime y RLS

Las suscripciones de Supabase Realtime también respetan las políticas RLS. Cuando el cliente se suscribe a cambios de una tabla, Supabase evalúa la política `SELECT` del usuario al entregar cada evento: solo recibe las filas que podría consultar con un `SELECT` normal.

En este sistema, la suscripción más sensible es la de `sec_authz_version`:

```typescript
// src/lib/security/permission-context.tsx
supabase.channel(`authz:${userId}`)
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "sec_authz_version",
    filter: `user_id=eq.${userId}`,    // Solo los cambios del propio usuario
  }, async () => {
    await supabase.auth.refreshSession(); // 1. Obtiene nuevo JWT con app_authz.v actualizado
    router.refresh();                    // 2. El layout re-solicita el snapshot desde servidor
  })
```

La política RLS de `sec_authz_version` (`USING (user_id = auth.uid())`) garantiza que un usuario solo recibe eventos de su propia fila, no de la de otros usuarios.

#### 5.5.8 Flujo completo: cambio de permisos → nueva RLS efectiva

```
Administrador modifica permisos en /admin/settings/users
        │
        ▼
Server Action / Route Handler (usa createAdminClient — bypasea RLS)
  → Actualiza sec_permissions / sec_user_roles
  → Trigger on_authz_change incrementa sec_authz_version.version
        │
        ▼ (Supabase Realtime — solo para ese user_id)
PermissionProvider en el browser del usuario afectado
  → supabase.auth.refreshSession()       ← nuevo JWT: app_authz.v actualizado
  → router.refresh()                     ← Next.js re-renderiza el layout
        │
        ▼
getSessionAuthz() en el server (layout.tsx)
  → Verifica app_authz.v en nuevo JWT vs caché LRU
  → Si versión nueva: re-consulta sec_permissions con createAdminClient
  → Nuevo PermissionSnapshot distribuido por PermissionProvider
        │
        ▼
RLS en PostgreSQL (para las consultas directas desde browser)
  → auth.jwt() lee el nuevo JWT
  → Políticas evaluadas con permisos actualizados
  → Realtime también filtra con el nuevo JWT
```

#### 5.5.9 RLS como última línea de defensa

En la arquitectura del módulo, el orden de las capas de control es:

1. **Proxy / Edge** (`src/proxy.ts`) — verifica sesión y claim `app_authz`; redirección inmediata sin llegar al servidor de aplicación.
2. **Guard de página** (`requireOption`) — Server Component; redirige si sin permiso READ.
3. **Guard de API** (`checkAdmin`, `requireRoleLevel`) — Route Handlers; retorna 401/403.
4. **Guard de acción** (`withRole`, `withCompanyAccess`) — Server Actions; lanza error.
5. **RLS en PostgreSQL** — última barrera; bloquea la consulta SQL aunque las capas anteriores fallaran.

Las capas 1–4 protegen a nivel de aplicación y retornan respuestas HTTP controladas. La capa 5 (RLS) es la **garantía de integridad de los datos**: incluso si hubiera un bug en las capas anteriores que permitiera llegar a una consulta no autorizada, PostgreSQL denegaría el acceso directamente.

> En la práctica, las capas de aplicación atrapan prácticamente todos los accesos no autorizados. Las RLS son el seguro ante escenarios excepcionales: bugs, vulnerabilidades futuras, o acceso directo a la API de Supabase con credenciales de usuario (anon key).

---

## 6. Cómo agregar una nueva funcionalidad protegida

Cuando se desarrolla una nueva pantalla o Route Handler que debe estar bajo control de permisos, seguir estos pasos en orden:

### Paso 1: Registrar la opción en la base de datos

Insertar en `sec_modules` (si es un módulo nuevo) y en `sec_options`:

```sql
-- Solo si es módulo nuevo:
INSERT INTO sec_modules (id, code, name, icon, order_index, is_active)
VALUES (gen_random_uuid(), 'NUEVO_MOD', 'Nuevo Módulo', 'package', 10, true);

-- La opción:
INSERT INTO sec_options (id, module_id, code, name, path_route, order_index, is_active)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM sec_modules WHERE code = 'NUEVO_MOD'),
  'NUEVO_OPCION',
  'Nombre Legible',
  '/admin/nueva-ruta',
  1,
  true
);

-- Recursos opcionales (si hay control por tabla):
INSERT INTO sec_resources (id, option_id, table_name, display_name)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM sec_options WHERE code = 'NUEVO_OPCION'),
  'nombre_tabla',
  'Nombre Tabla UI'
);
```

### Paso 2: Registrar la ruta en `routes.generated.ts`

Agregar en `SECURED_ROUTES` **ordenado de más específico a más general** (rutas más largas primero):

```typescript
{ prefix: '/admin/nueva-ruta', option: 'NUEVO_OPCION', module: 'NUEVO_MOD' },
```

### Paso 3: Proteger el `page.tsx` (Server Component)

```typescript
// Guard dual: nuevo sistema primero, legado de respaldo
try {
  const { requireOption } = await import("@/lib/security/server");
  await requireOption("NUEVO_OPCION");
} catch {
  const { error } = await requireRoleLevel(8);
  if (error) redirect("/admin/settings");
}
```

### Paso 4: Proteger los Route Handlers

```typescript
// En el Route Handler:
import { requirePermission } from "@/lib/security/server";

export async function POST(req: Request) {
  try {
    await requirePermission("NUEVO_OPCION", "nombre_tabla", "WRITE");
  } catch (err) {
    if (err instanceof ForbiddenError)
      return Response.json({ error: "Sin permiso" }, { status: 403 });
    throw err;
  }
  // ... lógica de negocio
}
```

### Paso 5: Usar `usePermission` / `<Can>` en el cliente

```tsx
"use client";
import { usePermission, Can } from "@/lib/security/permission-context";

export function MiComponente() {
  const { canView, can } = usePermission("NUEVO_OPCION");
  if (!canView) return null; // No debería llegar aquí (page.tsx ya bloqueó)

  return (
    <div>
      <Can option="NUEVO_OPCION" action="WRITE">
        <Button>Nuevo registro</Button>
      </Can>
      {can("DELETE", "nombre_tabla") && <DeleteButton />}
    </div>
  );
}
```

### Paso 6: Asignar permisos al rol en la UI

Ir a `/admin/settings/users` → pestaña **Roles · Permisos** → seleccionar el rol → activar los bits necesarios para `NUEVO_OPCION`.

---

## 7. Consideraciones de seguridad adicionales

### 7.1 Degradación graceful

El sistema está diseñado para funcionar aunque el módulo de seguridad avanzado no esté completamente configurado:
- Sin JWT Hook activo: `app_authz` ausente → el proxy no bloquea, las guards del servidor vuelven al sistema legado.
- Sin tablas `sec_*`: las páginas detectan `secRoles.length === 0` y muestran la UI legada.
- Sin snapshot disponible: `PermissionProvider` opera con `snapshot=null`; `canOption` devuelve `false` para todos excepto las páginas públicas.

### 7.2 No confiar en el cliente para decisiones de acceso

Los componentes `<Can>` y `usePermission` son **UX guards** (ocultan botones): no son la última línea de defensa. Los Route Handlers y Server Actions deben verificar permisos de forma independiente.

### 7.3 Auditabilidad

Toda operación de creación/modificación/eliminación de registros administrativos debe registrarse en `user_activity_log`. El módulo de seguridad en sí debe auditarse: cambios a `sec_permissions`, `sec_user_roles` y `sec_roles` son especialmente sensibles.

### 7.4 Rotación de contraseña temporal

Al crear un usuario nuevo (`createNewUserInternal`), se establece la contraseña temporal `Rioja2026!`. **Cambiar esta contraseña en producción** y forzar al usuario a cambiarla en su primer acceso.

### 7.5 Protección de la `SERVICE_ROLE_KEY`

La clave de service role de Supabase bypasea completamente el RLS. Solo debe usarse en:
- `createAdminClient()` llamado desde Server Actions o Route Handlers.
- Nunca en componentes de cliente.
- Nunca en variables de entorno `NEXT_PUBLIC_`.

### 7.6 Tokens de JWT y expiración

- El JWT de Supabase expira en 1 hora (configurable en el proyecto Supabase).
- El cliente `@supabase/ssr` refresca automáticamente el token antes de que expire.
- Cuando se revoca un rol a un usuario, el token anterior sigue siendo válido hasta que expire (máximo 1 hora), a menos que el usuario refresque la sesión. La suscripción Realtime a `sec_authz_version` mitiga esto al forzar el refresco inmediato.

### 7.7 XSS y almacenamiento de cookies

Las cookies de Supabase se fijan con `HttpOnly=true`, `SameSite=Lax`, `Secure=true` en producción. No son accesibles desde JavaScript del cliente, lo que protege contra robo de sesión por XSS.

---

## 8. Resumen de flujos de verificación

| Punto de verificación | Mecanismo | ¿Bloquea? |
| :-------------------- | :-------- | :-------- |
| Acceso a `/admin/*` sin sesión | Proxy → redirect `/login` | Sí |
| Sesión sin empresa seleccionada | Proxy → redirect `/auth/select-company` | Sí |
| Usuario sin ningún permiso (hook activo) | Proxy → redirect `/acceso-denegado` | Sí |
| Acceso a ruta específica sin permiso | `requireOption()` en `page.tsx` → redirect | Sí |
| Componente/botón sin permiso | `usePermission()` / `<Can>` → oculta el elemento | UI only |
| Server Action sin permiso | `withRole()` / `requirePermission()` → `{ success: false }` | Sí |
| Route Handler sin permiso | `checkAdmin()` / `requirePermission()` → HTTP 401/403 | Sí |
| Acceso directo a BD sin RLS | RLS policies → error SQL | Sí |
| Invalidación de permisos en tiempo real | Realtime `sec_authz_version` → refresca JWT | Automático |

---

## 9. Activar y desactivar el módulo de seguridad

El módulo de seguridad avanzado se controla con la variable de entorno `SECURITY_MODULE_ENABLED`. Cuando su valor es `"true"`, el proxy aplica la verificación de opciones sobre todas las rutas `/admin/*` catalogadas en `SECURED_ROUTES`. Cuando es `"false"` (o está ausente), el proxy deja pasar a cualquier usuario autenticado sin verificar sus permisos granulares.

### 9.1 Variable de entorno

| Variable | Valor activo | Valor inactivo | Ámbito |
| :------- | :----------- | :------------- | :----- |
| `SECURITY_MODULE_ENABLED` | `"true"` | `"false"` o ausente | Servidor (sin prefijo `NEXT_PUBLIC_`) |

> **Nota:** esta variable es solo de servidor. No debe exponerse con el prefijo `NEXT_PUBLIC_`, ya que contiene configuración de control de acceso. El layout admin la lee en un Server Component; el icono indicador (§9.4) también se evalúa en servidor.

### 9.2 Comportamiento según el valor

| Estado | Efecto en el proxy (`proxy.ts`) | Efecto en el navbar admin |
| :----- | :------------------------------ | :------------------------ |
| `true` | Verifica `app_authz` y `matchRoute(path)`; redirige a `/acceso-denegado` si sin permiso | Muestra icono candado (Lock) en ámbar |
| `false` o ausente | Sale antes de la verificación de permisos; cualquier usuario autenticado accede a todas las rutas admin | No muestra el icono candado |

Extracto del proxy donde se aplica el bypass:

```typescript
// proxy.ts
const securityEnabled = process.env.SECURITY_MODULE_ENABLED === "true";
// ...
if (!securityEnabled) return response;  // ← bypass completo al módulo avanzado
```

### 9.3 Desactivar el módulo en producción (Vercel)

1. Ir a **Vercel → proyecto `la-rioja` → Settings → Environment Variables**.
2. Localizar `SECURITY_MODULE_ENABLED` y cambiar su valor de `true` a `false` (o eliminarla).
3. Hacer clic en **Save**.
4. Ir a **Deployments**, seleccionar el último deployment exitoso y elegir **⋯ → Redeploy**.
5. Dejar marcado **"Use existing Build Cache"** (el redeploy con cache es suficiente; no hay cambio de código).
6. Esperar a que el nuevo deployment quede en estado **Ready** y esté asignado al dominio de producción.

> **Importante:** el cambio de la variable **no surte efecto de inmediato**. Vercel inyecta las variables de entorno en el momento del deployment, no las recarga en caliente. El redeploy es obligatorio.

### 9.4 Indicador visual en el navbar admin

El header del layout admin (`src/app/admin/layout.tsx`) muestra un icono de candado (lucide-react `Lock`) a la izquierda del toggle de tema cuando `SECURITY_MODULE_ENABLED=true`:

- **Color:** ámbar (`text-amber-500 / dark:text-amber-400`).
- **Tooltip:** "Módulo de seguridad activo" (al pasar el cursor).
- **Implementación:** Server Component; lee `process.env.SECURITY_MODULE_ENABLED` directamente.

```tsx
{process.env.SECURITY_MODULE_ENABLED === "true" && (
  <span title="Módulo de seguridad activo">
    <Lock size={18} className="text-amber-500 dark:text-amber-400" />
  </span>
)}
```

Al desactivar el módulo y hacer redeploy, el icono desaparece automáticamente sin ningún cambio de código adicional.
