-- ============================================================================
-- Migration: Nueva sección de video 'cl_video_2' en la página 'home'
-- ============================================================================
-- Crea 'cl_video_2' inmediatamente después de 'cl_video' (content_order = 61)
-- copiando el contenido de 'cl_video' y configurando el enlace de YouTube
-- https://youtu.be/0rCP5NMMasY con aspect "9;16".
-- ============================================================================

INSERT INTO public.site_content (
  page,
  section_key,
  title,
  description,
  image_url,
  metadata,
  content_order,
  is_active
)
SELECT
  page,
  'cl_video_2',
  title,
  description,
  'https://youtu.be/0rCP5NMMasY',
  COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'url', 'https://youtu.be/0rCP5NMMasY',
    'videoId', '0rCP5NMMasY',
    'aspect', '9;16',
    'visible', true
  ),
  61,
  true
FROM public.site_content
WHERE page = 'home'
  AND section_key = 'cl_video'
  AND NOT EXISTS (
    SELECT 1
    FROM public.site_content
    WHERE page = 'home'
      AND section_key = 'cl_video_2'
  );
