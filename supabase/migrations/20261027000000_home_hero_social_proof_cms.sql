-- Migración: Parametrizar prueba social en el Hero de la portada (cl_hero)
-- Permite editar desde el CMS el texto destacado, el texto complementario y las insignias métricas del Hero.
-- Idempotente: actualiza el JSONB metadata de cl_hero sin alterar otros campos.

UPDATE public.site_content
SET
  metadata = metadata || jsonb_build_object(
    'prueba_social_destacado', '+30 escuelas',
    'prueba_social_texto', 'articuladas con formación avalada por la Dirección de Educación.',
    'prueba_social_badges', jsonb_build_array('33a', '52+', '20p')
  ),
  updated_at = now()
WHERE
  page = 'home'
  AND section_key = 'cl_hero';
