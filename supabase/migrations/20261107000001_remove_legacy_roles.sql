-- Eliminar sistema de roles legado.
-- Reemplazado completamente por las tablas sec_* (sec_roles, sec_user_roles, sec_permissions).

-- 1. Eliminar función is_superadmin() que depende de la tabla roles
DROP FUNCTION IF EXISTS public.is_superadmin();

-- 2. Eliminar políticas RLS de la tabla roles (antes de dropear la tabla)
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_admin_manage_policy" ON public.roles;

-- 3. Eliminar columna role_id de user_companies (FK al sistema legado)
ALTER TABLE public.user_companies DROP COLUMN IF EXISTS role_id;

-- 4. Eliminar columna role_id de users (FK al sistema legado)
ALTER TABLE public.users DROP COLUMN IF EXISTS role_id;

-- 5. Eliminar tabla roles (en cascada elimina FK constraints pendientes)
DROP TABLE IF EXISTS public.roles CASCADE;
