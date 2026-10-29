-- Migración para sincronizar la secuencia de roles_role_id_seq y asegurar políticas RLS

-- 1. Sincronizar la secuencia roles_role_id_seq con el valor máximo actual de role_id
SELECT setval(
  pg_get_serial_sequence('roles', 'role_id'),
  COALESCE((SELECT MAX(role_id) FROM roles), 1)
);

-- 2. Asegurar que las políticas de RLS permitan lectura y gestión adecuada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'roles_select_policy'
  ) THEN
    CREATE POLICY "roles_select_policy" ON roles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Permitir gestión (INSERT, UPDATE, DELETE) a usuarios con rol SuperAdmin (nivel >= 10)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'roles_admin_manage_policy'
  ) THEN
    CREATE POLICY "roles_admin_manage_policy" ON roles
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users u
          JOIN roles r ON r.role_id = u.role_id
          WHERE u.id = auth.uid() AND r.level >= 10
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users u
          JOIN roles r ON r.role_id = u.role_id
          WHERE u.id = auth.uid() AND r.level >= 10
        )
      );
  END IF;
END $$;
