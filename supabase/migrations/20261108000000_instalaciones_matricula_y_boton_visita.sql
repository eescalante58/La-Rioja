-- =============================================================================
-- Migración: Acceso a instalaciones en /matricula y botón «Agendar una visita» en /about
-- Fecha: 2026-11-08
-- =============================================================================

-- 1. Bloque de acceso a instalaciones en /matricula
INSERT INTO public.site_content (page, section_key, title, description, image_url, content_order, is_active, metadata)
SELECT 'matricula'::public.site_page_type, 'matricula_instalaciones',
       'Conoce nuestras instalaciones',
       'Antes de tu visita, recorre los espacios donde tu familiar aprenderá, compartirá y se formará cada día.',
       NULL, 45, true,
       '{"antetitulo":"Instalaciones","boton":"Ver instalaciones","enlace_texto":"Ver la sección completa en Quiénes Somos","enlace":"/about#instalaciones","fotos":4}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE page::text = 'matricula' AND section_key = 'matricula_instalaciones'
);

-- 2. Texto del botón «Agendar una visita» en /about (solo si la llave no existe)
UPDATE public.site_content
   SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"boton_visita":"Agendar una visita"}'::jsonb,
       updated_at = now()
 WHERE page::text IN ('quienes somos', 'about')
   AND section_key = 'cl_instalaciones'
   AND NOT (COALESCE(metadata, '{}'::jsonb) ? 'boton_visita');
