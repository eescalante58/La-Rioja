-- Migration: catálogo de productos elaborados por los estudiantes
-- (página pública /productos, administración en /admin/productos).
--
-- Lectura pública solo de productos publicados (is_active = true).
-- Las escrituras del admin pasan por Server Actions con service role
-- (guards withRole/withCompanyAccess); las políticas de escritura replican
-- el patrón de event_gallery como defensa en profundidad.


CREATE TABLE IF NOT EXISTS public.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    bigint NOT NULL,
  name          text NOT NULL,
  description   text,
  category      text NOT NULL,
  price         numeric(10,2) CHECK (price IS NULL OR price >= 0),
  unit          text,
  image_url     text,
  is_available  boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  content_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


COMMENT ON TABLE public.products IS
  'Productos elaborados por los estudiantes en los talleres (catálogo público /productos).';
COMMENT ON COLUMN public.products.price IS 'Precio en USD; NULL = «Precio a consultar».';
COMMENT ON COLUMN public.products.unit IS 'Unidad de venta (unidad, docena, libra…).';
COMMENT ON COLUMN public.products.is_available IS 'false = se muestra como «Agotado».';
COMMENT ON COLUMN public.products.is_active IS 'false = oculto en el sitio público.';


CREATE INDEX IF NOT EXISTS products_company_active_order_idx
  ON public.products (company_id, is_active, content_order);


CREATE OR REPLACE FUNCTION public.products_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_set_updated_at();


ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Lectura pública de productos activos" ON public.products;
CREATE POLICY "Lectura pública de productos activos"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


DROP POLICY IF EXISTS "Gestión de productos por pertenencia a empresa" ON public.products;
CREATE POLICY "Gestión de productos por pertenencia a empresa"
  ON public.products FOR ALL
  TO authenticated
  USING (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = products.company_id AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = products.company_id AND uc.user_id = auth.uid()
    )
  );


-- Privilegios (las tablas creadas por SQL Editor no reciben GRANT automático;
-- sin ellos RLS ni siquiera se evalúa: "permission denied for table products").
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;


-- Bucket público para las fotos de los productos (máx. 5 MB, solo imágenes).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product_images',
  'product_images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


DROP POLICY IF EXISTS "Lectura pública de fotos de productos" ON storage.objects;
CREATE POLICY "Lectura pública de fotos de productos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product_images');
