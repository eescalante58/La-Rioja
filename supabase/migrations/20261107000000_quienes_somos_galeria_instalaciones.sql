-- Migration: Sección «Conoce nuestras instalaciones» (/about) y tabla genérica site_gallery_media
--
-- Soporta fotos y videos (archivos directos en bucket site_gallery y videos de YouTube)
-- para la sección «Conoce nuestras instalaciones» (section_key = 'cl_instalaciones')
-- de /about, administrable desde el CMS con arrastrar y soltar (RPC atómico).
--
-- Idempotente.

-- 1. Tabla site_gallery_media
CREATE TABLE IF NOT EXISTS public.site_gallery_media (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page                public.site_page_type NOT NULL,
  gallery_key         text NOT NULL CHECK (gallery_key ~ '^cl_[a-z0-9_]+$'),
  media_type          text NOT NULL CHECK (media_type IN ('image', 'video', 'youtube')),
  media_url           text NOT NULL,
  storage_path        text,
  poster_url          text,
  poster_storage_path text,
  youtube_id          text CHECK (youtube_id IS NULL OR youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  duration_seconds    integer CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  alt_text            text NOT NULL CHECK (char_length(btrim(alt_text)) BETWEEN 5 AND 150),
  caption             text CHECK (caption IS NULL OR char_length(caption) <= 60),
  content_order       integer NOT NULL CHECK (content_order > 0),
  is_active           boolean NOT NULL DEFAULT true,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_gallery_media_kind_chk CHECK (
    (media_type = 'image'   AND storage_path IS NOT NULL AND youtube_id IS NULL) OR
    (media_type = 'video'   AND storage_path IS NOT NULL AND poster_url IS NOT NULL AND youtube_id IS NULL) OR
    (media_type = 'youtube' AND storage_path IS NULL AND youtube_id IS NOT NULL AND poster_url IS NOT NULL)
  ),
  CONSTRAINT site_gallery_media_order_uq UNIQUE (page, gallery_key, content_order)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS site_gallery_media_public_idx
  ON public.site_gallery_media (page, gallery_key, is_active, content_order);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.site_gallery_media_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_gallery_media_updated_at ON public.site_gallery_media;
CREATE TRIGGER trg_site_gallery_media_updated_at
  BEFORE UPDATE ON public.site_gallery_media
  FOR EACH ROW EXECUTE FUNCTION public.site_gallery_media_set_updated_at();

-- 2. RLS y privilegios
ALTER TABLE public.site_gallery_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de elementos activos de galerías" ON public.site_gallery_media;
CREATE POLICY "Lectura pública de elementos activos de galerías"
  ON public.site_gallery_media FOR SELECT TO anon, authenticated
  USING (is_active = true);

GRANT SELECT ON public.site_gallery_media TO anon, authenticated;
GRANT ALL ON public.site_gallery_media TO service_role;

-- 3. Función RPC de reordenamiento atómico
CREATE OR REPLACE FUNCTION public.reorder_site_gallery(
  p_page public.site_page_type,
  p_gallery_key text,
  p_ids uuid[]
) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- La lista debe traer exactamente los elementos de la galería, sin repetidos.
  IF cardinality(p_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x)
     OR cardinality(p_ids) <> (SELECT count(*) FROM site_gallery_media
                                WHERE page = p_page AND gallery_key = p_gallery_key) THEN
    RAISE EXCEPTION 'La lista de elementos no coincide con la galería' USING ERRCODE = '22023';
  END IF;

  UPDATE site_gallery_media g
     SET content_order = t.ord, updated_at = now()
    FROM unnest(p_ids) WITH ORDINALITY AS t(id, ord)
   WHERE g.id = t.id AND g.page = p_page AND g.gallery_key = p_gallery_key;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_site_gallery(public.site_page_type, text, uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_site_gallery(public.site_page_type, text, uuid[])
  TO service_role;

-- 4. Bucket público de almacenamiento (máx 50 MB, imágenes y videos directos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site_gallery',
  'site_gallery',
  true,
  52428800,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Lectura pública de archivos de galería del sitio" ON storage.objects;
CREATE POLICY "Lectura pública de archivos de galería del sitio"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'site_gallery');

-- 5. Fila semilla cl_instalaciones en site_content
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
  'quienes somos'::public.site_page_type,
  'cl_instalaciones',
  'Conoce nuestras instalaciones',
  'Recorre los espacios donde nuestros estudiantes aprenden, comparten y se forman cada día.',
  NULL,
  jsonb_build_object(
    'chip', 'Instalaciones',
    'fotos_visibles', 5,
    'mostrar_leyendas', true,
    'boton', '',
    'enlace', ''
  ),
  85,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content
   WHERE section_key = 'cl_instalaciones'
     AND (page = 'quienes somos'::public.site_page_type OR page = 'about'::public.site_page_type)
);
