-- Identificador legible de cada producto para enlazar su detalle en la
-- tienda: /productos?producto=<slug> (rediseño de La Rioja Shop).
-- Mismo formato y unicidad por empresa que product_catalogs.slug.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

-- Backfill desde el nombre: minúsculas, sin acentos, cualquier otro
-- carácter → guion. Los nombres repetidos dentro de una empresa reciben
-- sufijo -2, -3… en orden de creación (p. ej. los dos "Tote bag floral").
WITH base AS (
  SELECT
    id,
    company_id,
    created_at,
    COALESCE(
      NULLIF(
        trim(BOTH '-' FROM regexp_replace(
          lower(translate(name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')),
          '[^a-z0-9]+', '-', 'g'
        )),
        ''
      ),
      'producto'
    ) AS base_slug
  FROM public.products
  WHERE slug IS NULL
),
numbered AS (
  SELECT
    id,
    base_slug,
    row_number() OVER (PARTITION BY company_id, base_slug ORDER BY created_at, id) AS n
  FROM base
)
UPDATE public.products p
SET slug = CASE WHEN numbered.n = 1 THEN numbered.base_slug ELSE numbered.base_slug || '-' || numbered.n END
FROM numbered
WHERE p.id = numbered.id;

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.products
  ADD CONSTRAINT products_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE public.products
  ADD CONSTRAINT products_company_slug_key UNIQUE (company_id, slug);
