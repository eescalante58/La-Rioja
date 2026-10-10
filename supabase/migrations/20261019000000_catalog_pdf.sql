-- Migration: catálogo descargable en PDF por catálogo de La Rioja Shop.
--
-- El PDF se sube desde /admin/productos → «Catálogos y líneas» directo del
-- navegador a Storage con una URL de subida firmada (createSignedUploadUrl,
-- generada por el servidor con service role tras validar rol y empresa):
-- los PDF superan el límite de ~4.5 MB por petición de Vercel.
-- No hay políticas de escritura en el bucket: solo se sube con esa URL.
--
-- Idempotente.

ALTER TABLE public.product_catalogs
  ADD COLUMN IF NOT EXISTS pdf_url        text,
  ADD COLUMN IF NOT EXISTS pdf_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS pdf_updated_at timestamptz;

COMMENT ON COLUMN public.product_catalogs.pdf_url IS
  'URL pública del catálogo en PDF (bucket product_catalog_pdfs); NULL = sin PDF.';
COMMENT ON COLUMN public.product_catalogs.pdf_size_bytes IS
  'Tamaño del PDF en bytes (se muestra en el botón de descarga).';


-- Bucket público para los PDF (máx. 50 MB, solo PDF).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product_catalog_pdfs', 'product_catalog_pdfs', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


DROP POLICY IF EXISTS "Lectura pública de catálogos PDF" ON storage.objects;
CREATE POLICY "Lectura pública de catálogos PDF"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product_catalog_pdfs');
