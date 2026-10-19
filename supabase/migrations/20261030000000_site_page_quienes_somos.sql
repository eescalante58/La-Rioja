-- ============================================================================
-- Migration: Cambiar página CMS 'about' ("Nosotros") por 'quienes somos' ("Quienes Somos")
-- ============================================================================
-- Ejecutar en Supabase SQL Editor.
--
-- 1. Si el enum public.site_page_type tiene 'about' y aún no tiene 'quienes somos',
--    renombra el valor del enum directamente (lo cual actualiza automáticamente
--    todas las filas de public.site_content sin error de transacción).
-- 2. Si 'quienes somos' ya fue agregado previamente con ADD VALUE, el UPDATE
--    migra todos los registros existentes de 'about' a 'quienes somos'.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'site_page_type' AND e.enumlabel = 'about'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'site_page_type' AND e.enumlabel = 'quienes somos'
  ) THEN
    ALTER TYPE public.site_page_type RENAME VALUE 'about' TO 'quienes somos';
  END IF;
END $$;

UPDATE public.site_content
SET page = 'quienes somos'::public.site_page_type,
    updated_at = now()
WHERE page::text = 'about';
