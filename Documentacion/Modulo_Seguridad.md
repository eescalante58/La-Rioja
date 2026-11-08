# Módulo de Seguridad — Filosofía, Fundamentos y Referencia Técnica

**Versión del documento:** 1.0.0  
**Fecha:** noviembre de 2026  
**Aplica a:** La Rioja — Centro de Formación Laboral (backoffice `/admin`)

---

## 1. Filosofía y principios de diseño

### 1.1 Dos sistemas de autorización en coexistencia

El sistema tiene **dos capas de autorización** que conviven durante la transición al módulo de seguridad avanzado:

| Capa | Sistema | Almacenamiento | Momento de verificación |
| :--- | :------ | :------------- | :---------------------- |
| **Legado** | Nivel de rol numérico (`roles.level`) + membresía en empresa (`user_companies`) | BD via Admin client | Server Actions / Route Handlers (run-time) |
| **Avanzado** | Máscara de bits por opción y recurso (`sec_permissions`) + snapshot en JWT | JWT claim `app_authz` + snapshot en memoria | Proxy (edge), layout server, Server Action, Route Handler |

Ambas capas son **aditivas**: la capa legado actúa como red de seguridad mientras la capa avanzada se activa tabla a tabla y función a función. Una página puede usar ambas simultáneamente (el guard dual en `page.tsx` lo ejemplifica).

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

### 3.5 `src/lib/auth/authorization.ts` (capa legado)

| Exportación | Descripción |
| :---------- | :---------- |
| `requireRoleLevel(minLevel)` | Verifica nivel de rol global del usuario |
| `requireCompanyAccess(companyId)` | Verifica membresía en la empresa |
| `roleLevelOf(row)` | Extrae el nivel del rol de una fila de `users` |

### 3.6 `src/lib/auth/guards.ts` (capa legado)

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
| `users` | Perfil del usuario | Contiene `role_id` (rol legado) y es el origen de `auth.users.id` |
| `roles` | Catálogo de roles legado con `level` numérico | Base de `requireRoleLevel()` |
| `user_companies` | Membresía usuario-empresa | Base de `requireCompanyAccess()` y del filtrado RLS |
| `user_activity_log` | Bitácora de auditoría | Registro de acciones administrativas |

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

Todas las tablas `sec_*` tienen RLS habilitado:

| Tabla | Política de lectura | Política de escritura |
| :---- | :------------------ | :-------------------- |
| `sec_roles` | Todos los usuarios autenticados | Solo nivel ≥ 9 |
| `sec_modules` / `sec_options` / `sec_resources` | Todos los usuarios autenticados | Solo SuperAdmin |
| `sec_permissions` | Todos los usuarios autenticados | Solo nivel ≥ 9 |
| `sec_user_roles` | Propio usuario o nivel ≥ 9 | Solo nivel ≥ 9 |
| `sec_authz_version` | Propio usuario | Solo función hook (SECURITY DEFINER) |

> Las consultas que usa el sistema internamente se ejecutan con `createAdminClient()` (service role), que bypasea RLS. Las políticas RLS protegen el acceso directo desde PostgREST/el cliente de browser.

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
