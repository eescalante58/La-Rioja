-- Migration: actualización del registro CMS de ubicación y Google Maps.
--
-- En la página «Social Media» (page = 'social media' AND section_key = 'google maps'),
-- se migra la URL del mapa a metadata->>'url' y se establece en description la
-- dirección física oficial de la sede de La Rioja.

UPDATE public.site_content
SET
  description = 'Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador',
  metadata = jsonb_build_object('url', 'https://maps.app.goo.gl/pTJZ1iP4WrdbqCFk8?g_st=iw'),
  updated_at = now()
WHERE page = 'social media' AND section_key = 'google maps';

-- Inserción segura si la fila no existiera previamente:
INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT
  'social media'::public.site_page_type,
  'google maps',
  'Link Google Maps Ubicacion La Rioja',
  'Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador',
  NULL,
  '{"url": "https://maps.app.goo.gl/pTJZ1iP4WrdbqCFk8?g_st=iw"}'::jsonb,
  0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content
  WHERE page = 'social media' AND section_key = 'google maps'
);
