-- ============================================================
-- Garantizar que un usuario no tenga más de un rol activo
-- con is_super_admin = true al mismo tiempo.
--
-- Se implementa como trigger BEFORE INSERT/UPDATE en
-- sec_user_roles, para que el error sea claro en la UI
-- y en el REGISTRY de acciones (users.assignUserRole).
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_single_superadmin_per_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $$
BEGIN
  -- Solo aplica cuando la fila resultante queda activa y el rol es super_admin
  IF NEW.is_active = true
    AND EXISTS (
      SELECT 1 FROM public.sec_roles
      WHERE id = NEW.role_id AND is_super_admin = true
    )
  THEN
    -- Verificar que no haya otra fila activa con un rol super_admin para este usuario
    IF EXISTS (
      SELECT 1
      FROM public.sec_user_roles sur
      JOIN public.sec_roles sr ON sr.id = sur.role_id AND sr.is_super_admin = true
      WHERE sur.user_id = NEW.user_id
        AND sur.is_active = true
        AND sur.id <> NEW.id  -- excluir la fila actual en UPDATE
    ) THEN
      RAISE EXCEPTION 'Un usuario no puede tener más de un rol Super Administrador activo a la vez.'
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Disparar antes de INSERT y UPDATE para validar en ambos casos
DROP TRIGGER IF EXISTS trg_one_superadmin_per_user ON public.sec_user_roles;
CREATE TRIGGER trg_one_superadmin_per_user
  BEFORE INSERT OR UPDATE ON public.sec_user_roles
  FOR EACH ROW EXECUTE FUNCTION public.check_single_superadmin_per_user();
