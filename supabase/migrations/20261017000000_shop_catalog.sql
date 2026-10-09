-- Migration: La Rioja Shop — catálogos, líneas y variantes (fase EXPANDIR).
--
-- Estructura de los catálogos 2025 (Arte y Costura, Panadería):
--   product_catalogs (taller)  →  product_lines (Tote Bags, Toallas…)
--   →  products  →  product_variants (precio/presentación).
--
-- Fase expandir: solo agrega tablas/columnas. products.category, price, unit
-- e is_available se conservan para que el código desplegado siga
-- funcionando; se eliminan en 20261017000003_shop_drop_legacy.sql cuando el
-- código nuevo esté en producción.
--
-- Idempotente: puede ejecutarse más de una vez.


-- ----------------------------------------------------------------------------
-- 1. Catálogos (uno por taller)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_catalogs (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id      bigint NOT NULL REFERENCES public.companies (company_id),
  slug            text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text NOT NULL,
  tagline         text,
  description     text,
  cover_image_url text,
  content_order   integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

COMMENT ON TABLE public.product_catalogs IS
  'Catálogos de La Rioja Shop (uno por taller: Arte y Costura, Panadería).';
COMMENT ON COLUMN public.product_catalogs.tagline IS 'Lema del catálogo.';
COMMENT ON COLUMN public.product_catalogs.description IS 'Texto «Quiénes somos» del taller.';


-- ----------------------------------------------------------------------------
-- 2. Líneas (agrupación dentro del catálogo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_lines (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  catalog_id    bigint NOT NULL REFERENCES public.product_catalogs (id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  slogan        text,
  content_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalog_id, name)
);

COMMENT ON TABLE public.product_lines IS
  'Líneas de producto dentro de un catálogo (Tote Bags, Toallas de mano, Paneras…).';

CREATE INDEX IF NOT EXISTS product_lines_catalog_order_idx
  ON public.product_lines (catalog_id, content_order);


-- ----------------------------------------------------------------------------
-- 3. Variantes (precio y presentación; todo producto tiene al menos una)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id    uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  label         text,
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  unit          text,
  is_available  boolean NOT NULL DEFAULT true,
  content_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_variants IS
  'Presentaciones de un producto con su precio (p. ej. Pequeña $10 / Grande $15).';
COMMENT ON COLUMN public.product_variants.label IS
  'Nombre de la presentación; NULL si el producto tiene una sola.';
COMMENT ON COLUMN public.product_variants.unit IS
  'Unidad de venta del precio (p. ej. «2 unidades» para «2 x $0.25»).';
COMMENT ON COLUMN public.product_variants.is_available IS 'false = se muestra como «Agotado».';

CREATE INDEX IF NOT EXISTS product_variants_product_order_idx
  ON public.product_variants (product_id, content_order);


-- ----------------------------------------------------------------------------
-- 4. products.line_id (nullable en esta fase)
-- ----------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS line_id bigint REFERENCES public.product_lines (id) ON DELETE RESTRICT;

-- El código nuevo ya no escribe la categoría (la da la línea): opcional
-- hasta que 20261017000003_shop_drop_legacy.sql elimine la columna.
ALTER TABLE public.products ALTER COLUMN category DROP NOT NULL;

CREATE INDEX IF NOT EXISTS products_line_order_idx
  ON public.products (line_id, content_order);


-- ----------------------------------------------------------------------------
-- 5. updated_at (reutiliza la función de products)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS product_catalogs_set_updated_at ON public.product_catalogs;
CREATE TRIGGER product_catalogs_set_updated_at
  BEFORE UPDATE ON public.product_catalogs
  FOR EACH ROW EXECUTE FUNCTION public.products_set_updated_at();

DROP TRIGGER IF EXISTS product_lines_set_updated_at ON public.product_lines;
CREATE TRIGGER product_lines_set_updated_at
  BEFORE UPDATE ON public.product_lines
  FOR EACH ROW EXECUTE FUNCTION public.products_set_updated_at();

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.products_set_updated_at();


-- ----------------------------------------------------------------------------
-- 6. RLS (mismo patrón que products: lectura pública de lo activo; escritura
--    por pertenencia a la empresa — las Server Actions usan service role).
-- ----------------------------------------------------------------------------
ALTER TABLE public.product_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de catálogos activos" ON public.product_catalogs;
CREATE POLICY "Lectura pública de catálogos activos"
  ON public.product_catalogs FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Gestión de catálogos por pertenencia a empresa" ON public.product_catalogs;
CREATE POLICY "Gestión de catálogos por pertenencia a empresa"
  ON public.product_catalogs FOR ALL
  TO authenticated
  USING (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = product_catalogs.company_id AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = product_catalogs.company_id AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Lectura pública de líneas activas" ON public.product_lines;
CREATE POLICY "Lectura pública de líneas activas"
  ON public.product_lines FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Gestión de líneas por pertenencia a empresa" ON public.product_lines;
CREATE POLICY "Gestión de líneas por pertenencia a empresa"
  ON public.product_lines FOR ALL
  TO authenticated
  USING (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.product_catalogs c
      JOIN public.user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = product_lines.catalog_id AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.product_catalogs c
      JOIN public.user_companies uc ON uc.company_id = c.company_id
      WHERE c.id = product_lines.catalog_id AND uc.user_id = auth.uid()
    )
  );

-- Variantes: visibles si su producto está publicado.
DROP POLICY IF EXISTS "Lectura pública de variantes de productos activos" ON public.product_variants;
CREATE POLICY "Lectura pública de variantes de productos activos"
  ON public.product_variants FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id AND p.is_active = true
    )
  );

DROP POLICY IF EXISTS "Gestión de variantes por pertenencia a empresa" ON public.product_variants;
CREATE POLICY "Gestión de variantes por pertenencia a empresa"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_companies uc ON uc.company_id = p.company_id
      WHERE p.id = product_variants.product_id AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin_global() OR EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.user_companies uc ON uc.company_id = p.company_id
      WHERE p.id = product_variants.product_id AND uc.user_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- 7. Privilegios (las tablas creadas por SQL Editor no reciben GRANT
--    automático; sin ellos: "permission denied for table ...").
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.product_catalogs, public.product_lines, public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.product_catalogs, public.product_lines, public.product_variants TO authenticated;


-- ----------------------------------------------------------------------------
-- 8. Datos base: los dos catálogos 2025 de La Rioja (empresa 1)
-- ----------------------------------------------------------------------------
INSERT INTO public.product_catalogs (company_id, slug, name, tagline, description, content_order)
VALUES
  (1, 'arte-y-costura', 'Arte y Costura',
   'Arte y costura en cada creación.',
   'En el Taller de Costura del Centro de Formación Laboral La Rioja formamos estudiantes en técnicas textiles, fomentando la precisión, la creatividad y el trabajo con las manos. En el Taller de Arte exploran distintas formas de expresión artística, desarrollando su sensibilidad, imaginación y habilidades plásticas.',
   1),
  (1, 'panaderia', 'Panadería La Rioja',
   'Sabor que incluye a todos',
   'Panadería La Rioja es mucho más que un lugar donde se hornea pan: es un espacio de formación, inclusión y talento. Cada pan, factura o bizcocho cuenta una historia de superación y aprendizaje de nuestros estudiantes.',
   2)
ON CONFLICT (company_id, slug) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 9. Relleno de productos existentes (creados con el admin anterior):
--    categoría → catálogo, línea «General» del catálogo y variante única.
-- ----------------------------------------------------------------------------
-- Catálogo para empresas con productos que aún no tengan catálogos.
INSERT INTO public.product_catalogs (company_id, slug, name, content_order)
SELECT DISTINCT p.company_id, v.slug, v.name, v.ord
  FROM public.products p
 CROSS JOIN (VALUES ('arte-y-costura', 'Arte y Costura', 1),
                    ('panaderia', 'Panadería La Rioja', 2)) AS v(slug, name, ord)
 WHERE p.line_id IS NULL
ON CONFLICT (company_id, slug) DO NOTHING;

-- Línea «General» en cada catálogo que reciba productos sin línea.
INSERT INTO public.product_lines (catalog_id, name, content_order)
SELECT DISTINCT c.id, 'General', 99
  FROM public.products p
  JOIN public.product_catalogs c
    ON c.company_id = p.company_id
   AND c.slug = CASE WHEN p.category ILIKE 'pan%' THEN 'panaderia' ELSE 'arte-y-costura' END
 WHERE p.line_id IS NULL
ON CONFLICT (catalog_id, name) DO NOTHING;

-- Variante única con el precio/unidad/disponibilidad actuales.
INSERT INTO public.product_variants (product_id, label, price, unit, is_available)
SELECT p.id, NULL, COALESCE(p.price, 0), p.unit, p.is_available
  FROM public.products p
 WHERE p.line_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id);

UPDATE public.products p
   SET line_id = l.id
  FROM public.product_catalogs c
  JOIN public.product_lines l ON l.catalog_id = c.id AND l.name = 'General'
 WHERE p.line_id IS NULL
   AND c.company_id = p.company_id
   AND c.slug = CASE WHEN p.category ILIKE 'pan%' THEN 'panaderia' ELSE 'arte-y-costura' END;
