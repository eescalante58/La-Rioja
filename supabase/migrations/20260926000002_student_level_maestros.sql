-- ============================================================================
-- Students: nuevo nivel '6.Maestros' en student_level_enum
-- ----------------------------------------------------------------------------
-- Ejecutar en Supabase SQL Editor (sin envolver en BEGIN/COMMIT:
-- ALTER TYPE ... ADD VALUE no permite transacción).
-- ============================================================================

ALTER TYPE public.student_level_enum ADD VALUE IF NOT EXISTS '6.Maestros';
