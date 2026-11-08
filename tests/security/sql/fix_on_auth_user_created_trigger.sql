-- ============================================================
-- FIX: trigger on_auth_user_created referencia role_id eliminada
-- Archivo: tests/security/sql/fix_on_auth_user_created_trigger.sql
-- Ejecutar en: Supabase SQL Editor (proyecto wfkqsifhxnarmxrvbgiu)
-- Causa: La migración 20261107000001_remove_legacy_roles.sql eliminó
--        public.users.role_id, pero el trigger on_auth_user_created
--        aún intenta insertar esa columna → "Database error creating
--        new user" para TODOS los usuarios desde 2026-11-07.
-- ============================================================

-- ── Paso 1: Ver fuente del trigger actual (diagnóstico) ───────────────────────
SELECT proname, pg_get_functiondef(oid) AS current_def
FROM pg_proc WHERE proname = 'handle_new_user';

-- ── Paso 2: Ver columnas actuales de public.users ─────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- ── Paso 3: Reemplazar la función con la versión correcta (sin role_id) ───────
-- Ajustar el INSERT si el resultado del Paso 1 muestra campos adicionales
-- que siguen siendo válidos (phone, avatar_url, etc.).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public', 'extensions'
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    status
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotente: si el perfil ya existe, no falla
  RETURN new;
END;
$$;

-- ── Paso 4: Verificar que el trigger sigue apuntando a la función ─────────────
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- ── Paso 5: Prueba de humo — crear y borrar usuario de prueba ─────────────────
-- (Ejecutar desde la API de Supabase o el panel Authentication)
-- Si createUser ya no devuelve "Database error creating new user", el fix funcionó.
