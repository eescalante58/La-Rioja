-- Migration: La Rioja Shop — fase CONTRAER.
--
-- ⚠️ Ejecutar SOLO cuando el código nuevo de la tienda (catálogos, líneas y
-- variantes) ya esté desplegado en producción y verificado. El código
-- anterior lee estas columnas: ejecutarla antes rompe /productos y el admin.
--
-- Requiere que todo producto tenga línea (la migración 1 y el admin nuevo lo
-- garantizan). Si falla el SET NOT NULL, revisar:
--   SELECT id, name FROM public.products WHERE line_id IS NULL;

ALTER TABLE public.products ALTER COLUMN line_id SET NOT NULL;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS is_available;

-- El índice anterior usaba is_active; se mantiene. Índice por categoría ya no aplica.
DROP INDEX IF EXISTS public.products_company_active_order_idx;
CREATE INDEX IF NOT EXISTS products_company_active_order_idx
  ON public.products (company_id, is_active, content_order);
