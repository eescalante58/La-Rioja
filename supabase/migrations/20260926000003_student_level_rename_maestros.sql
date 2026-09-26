-- ============================================================================
-- Students: renombra '6.Maestros' → '6.Personal La Rioja' en student_level_enum
-- ----------------------------------------------------------------------------
-- RENAME VALUE actualiza automáticamente las filas que ya usen el valor.
--
-- Ejecutar en Supabase SQL Editor (sin envolver en BEGIN/COMMIT).
-- ============================================================================

ALTER TYPE public.student_level_enum
  RENAME VALUE '6.Maestros' TO '6.Personal La Rioja';
