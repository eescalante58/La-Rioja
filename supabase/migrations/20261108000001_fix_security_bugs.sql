-- ============================================================
-- fix(security): corrección de bugs de seguridad QA 2026-11-08
-- BUG-SEC-008: is_global_role() no verificaba valid_from/valid_to ni is_active del rol
-- BUG-SEC-009: sec_resources tenía fila con table_name='roles' (tabla eliminada)
-- BUG-SEC-010: sec_resources tenía recursos duplicados por table_name
-- BUG-SEC-012: handle_new_user() referenciaba columna role_id eliminada
-- ============================================================

-- ── BUG-SEC-008: is_global_role() con vigencia temporal y is_active del rol ──────
CREATE OR REPLACE FUNCTION public.is_global_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $$
  SELECT CASE p_role
    WHEN 'admin' THEN
      EXISTS (
        SELECT 1
        FROM   public.sec_user_roles sur
        JOIN   public.sec_roles sr ON sr.id = sur.role_id
        WHERE  sur.user_id      = (SELECT auth.uid())
          AND  sr.is_super_admin = true
          AND  sr.is_active      = true
          AND  sur.is_active     = true
          AND  (sur.valid_from IS NULL OR sur.valid_from <= now())
          AND  (sur.valid_to   IS NULL OR sur.valid_to   >= now())
      )
    ELSE
      EXISTS (
        SELECT 1
        FROM   public.sec_user_roles sur
        JOIN   public.sec_roles sr ON sr.id = sur.role_id
        WHERE  sur.user_id  = (SELECT auth.uid())
          AND  sr.is_active  = true
          AND  sur.is_active = true
          AND  (sur.valid_from IS NULL OR sur.valid_from <= now())
          AND  (sur.valid_to   IS NULL OR sur.valid_to   >= now())
      )
  END;
$$;

-- ── BUG-SEC-009: eliminar recurso que apunta a tabla 'roles' eliminada ──────────
DELETE FROM public.sec_resources WHERE table_name = 'roles';

-- ── BUG-SEC-010: eliminar duplicados en sec_resources sin permisos asignados ────
-- Para cada table_name con más de un registro, borra los que no tienen permisos.
-- Si ambas filas tienen permisos, no se borra ninguna (revisar manualmente).
WITH duplicates AS (
  SELECT table_name
  FROM   public.sec_resources
  GROUP  BY table_name
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT sr.id
  FROM   public.sec_resources sr
  JOIN   duplicates d ON d.table_name = sr.table_name
  WHERE  NOT EXISTS (
    SELECT 1 FROM public.sec_permissions sp WHERE sp.resource_id = sr.id
  )
)
DELETE FROM public.sec_resources WHERE id IN (SELECT id FROM to_delete);

-- ── BUG-SEC-012: documentar handle_new_user() en migraciones ────────────────────
-- Esta función fue corregida manualmente el 2026-11-08 en el SQL Editor de Supabase
-- tras la migración 20261107000001_remove_legacy_roles.sql eliminar la columna role_id.
-- Se replica aquí para que el estado del código en el repo refleje la BD.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public', 'extensions'
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Verificación post-migración
DO $$
BEGIN
  -- Confirmar que ya no hay duplicados
  IF EXISTS (
    SELECT table_name FROM public.sec_resources
    GROUP BY table_name HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE 'AVISO: Aún existen recursos duplicados en sec_resources con permisos en ambas filas — revisar manualmente.';
  ELSE
    RAISE NOTICE 'OK: No quedan recursos duplicados en sec_resources.';
  END IF;

  -- Confirmar que no hay entrada 'roles'
  IF EXISTS (SELECT 1 FROM public.sec_resources WHERE table_name = 'roles') THEN
    RAISE EXCEPTION 'ERROR: La fila roles sigue existiendo en sec_resources.';
  END IF;
END;
$$;
