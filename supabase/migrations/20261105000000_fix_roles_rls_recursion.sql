-- Corrección de recursión infinita (error 42P17) en políticas RLS de la tabla roles

-- 1. Eliminar la política anterior que causaba recursión infinita al auto-consultar la tabla roles
DROP POLICY IF EXISTS "roles_admin_manage_policy" ON public.roles;

-- 2. Asegurar política de lectura incondicional para usuarios autenticados
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy" ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Crear función auxiliar SECURITY DEFINER para verificar rol superadmin (nivel >= 10)
-- Al ser SECURITY DEFINER se ejecuta con privilegios de postgres y NO dispara RLS recursivo
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.id = auth.uid() AND r.level >= 10
  );
$$;

-- 4. Recrear la política de gestión administrativa usando la función SECURITY DEFINER
CREATE POLICY "roles_admin_manage_policy" ON public.roles
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
