-- Migration: sección de derechos reservados en el pie de página (CMS).
-- Permite parametrizar el texto de derechos reservados y copyright desde /admin/cms.

INSERT INTO public.site_content (
  page,
  section_key,
  title,
  description,
  metadata,
  content_order,
  is_active
)
SELECT
  'footer'::public.site_page_type,
  'derechos reservados',
  'Derechos Reservados',
  '© 2026 Asociación de Padres y Amigos de Personas con Discapacidad Intelectual (ASPAPREM) / Centro de Formación Laboral La Rioja.',
  '{}'::jsonb,
  0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content
   WHERE page = 'footer'::public.site_page_type
     AND section_key = 'derechos reservados'
);
