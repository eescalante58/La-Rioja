-- Migración: Parametrizar tarjeta de la foto en el Hero de Quiénes Somos (cl_hero)
-- Permite editar desde el CMS el título, subtítulo e insignia de la tarjeta flotante asociada a la foto.
-- Idempotente: actualiza el JSONB metadata de cl_hero sin alterar otros campos preexistentes.

UPDATE public.site_content
SET
  metadata = metadata || jsonb_build_object(
    'card_foto_titulo', 'Comunidad La Rioja',
    'card_foto_subtitulo', 'Educación, taller y convivencia',
    'card_foto_tag', 'ASPAPREM'
  ),
  updated_at = now()
WHERE
  page IN ('quienes somos', 'about')
  AND section_key = 'cl_hero';
