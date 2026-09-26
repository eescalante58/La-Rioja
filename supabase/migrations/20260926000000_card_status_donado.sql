-- ============================================================================
-- Cards: nuevo estado 'Donado' en card_status_enum
-- ----------------------------------------------------------------------------
-- Cartones donados (cortesía/patrocinio): no se venden, pero participan en
-- la tómbola junto a los 'Vendido' y podrán auto-registrarse en /registro.
--
-- Ejecutar en Supabase SQL Editor (sin envolver en BEGIN/COMMIT:
-- ALTER TYPE ... ADD VALUE no permite transacción).
-- ============================================================================

ALTER TYPE public.card_status_enum ADD VALUE IF NOT EXISTS 'Donado';
