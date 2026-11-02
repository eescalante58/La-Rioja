-- Migration: La Rioja Shop — Catálogo de temporada «Navidad 2026» (Variante A, empresa 1).
--
-- 1. Agrega columna opcional `badge` en `public.product_catalogs` para mostrar
--    una etiqueta corta en la píldora del taller (ej. «Temporada»).
-- 2. Crea el catálogo `navidad-2026` («Navidad 2026») con sus 3 líneas:
--      - Costura navideña (11 productos)
--      - Madera y decoración (5 productos)
--      - Galletas navideñas (1 producto con 2 presentaciones)
-- 3. Idempotente: no duplica líneas ni productos (mismo nombre en la misma línea)
--    y no sobrescribe cambios posteriores hechos desde /admin/productos.

ALTER TABLE public.product_catalogs
  ADD COLUMN IF NOT EXISTS badge text;

DO $$
DECLARE
  v_company    constant bigint := 1;
  v_catalog_id bigint;
  v_line_id    bigint;
  v_product_id uuid;
  v_slug       text;
  v_n          integer;
  r            record;
BEGIN
  -- --------------------------------------------------------------------------
  -- 1. Catálogo «Navidad 2026»
  -- --------------------------------------------------------------------------
  INSERT INTO public.product_catalogs
    (company_id, slug, name, badge, tagline, description, content_order, is_active)
  VALUES (
    v_company,
    'navidad-2026',
    'Navidad 2026',
    'Temporada',
    'Regala con propósito',
    '¡Esta Navidad, regala con propósito! Te invitamos a adquirir los productos elaborados por nuestros jóvenes en los talleres vocacionales de carpintería, panadería y costura del CFL La Rioja. Con tu compra apoyas su aprendizaje, talento y autonomía. Regala algo especial y transforma tu compra en una oportunidad. ¡Apoya el talento de nuestros jóvenes!',
    3,
    true
  )
  ON CONFLICT (company_id, slug) DO UPDATE
    SET badge = COALESCE(public.product_catalogs.badge, EXCLUDED.badge)
  RETURNING id INTO v_catalog_id;

  IF v_catalog_id IS NULL THEN
    SELECT id INTO v_catalog_id
      FROM public.product_catalogs
     WHERE company_id = v_company AND slug = 'navidad-2026';
  END IF;

  -- --------------------------------------------------------------------------
  -- 2. Líneas del catálogo «Navidad 2026»
  -- --------------------------------------------------------------------------
  INSERT INTO public.product_lines (catalog_id, name, description, slogan, content_order, is_active)
  VALUES
    (v_catalog_id, 'Costura navideña',
     'Artículos textiles navideños confeccionados a mano en el taller de costura del CFL La Rioja.',
     '¡Regala calidez hecha a mano!', 1, true),
    (v_catalog_id, 'Madera y decoración',
     'Piezas decorativas en madera elaboradas y pintadas en nuestros talleres vocacionales.',
     '¡Arte en madera con propósito!', 2, true),
    (v_catalog_id, 'Galletas navideñas',
     'Galletas artesanales decoradas con motivos navideños, horneadas en nuestro taller de panadería.',
     '¡Dulzura que impulsa futuros!', 3, true)
  ON CONFLICT (catalog_id, name) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 3. Productos y presentaciones (17 productos, 18 variantes)
  -- --------------------------------------------------------------------------
  FOR r IN
    SELECT * FROM (VALUES
      -- Costura navideña (11 productos)
      ('Costura navideña', 1,  'Adornos navideños',          'adornos-navidenos',          NULL,                         '[{"label":null,"price":3.00,"unit":"Bolsa de 4 unidades"}]'),
      ('Costura navideña', 2,  'Delantal navideño',          'delantal-navideno',          'Variedad de diseños.',       '[{"label":null,"price":3.75,"unit":null}]'),
      ('Costura navideña', 3,  'Panera',                     'panera',                     'En colores negro y beige.',  '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 4,  'Toalla de manos navideña 1', 'toalla-de-manos-navidena-1', 'Variedad de diseños.',       '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 5,  'Toalla de manos navideña 2', 'toalla-de-manos-navidena-2', NULL,                         '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 6,  'Toalla de manos navideña 3', 'toalla-de-manos-navidena-3', NULL,                         '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 7,  'Toalla de manos navideña 4', 'toalla-de-manos-navidena-4', NULL,                         '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 8,  'Toalla de manos navideña 5', 'toalla-de-manos-navidena-5', NULL,                         '[{"label":null,"price":8.00,"unit":null}]'),
      ('Costura navideña', 9,  'Tope de puerta coneja',      'tope-de-puerta-coneja',      'Variedad de colores.',       '[{"label":null,"price":12.00,"unit":null}]'),
      ('Costura navideña', 10, 'Tope de puerta Santa Claus', 'tope-de-puerta-santa-claus', NULL,                         '[{"label":null,"price":16.00,"unit":null}]'),
      ('Costura navideña', 11, 'Tortillera',                 'tortillera',                 NULL,                         '[{"label":null,"price":4.50,"unit":null}]'),
      -- Madera y decoración (5 productos)
      ('Madera y decoración', 1, 'Ángel de madera',     'angel-de-madera',     NULL,                        '[{"label":null,"price":9.00,"unit":null}]'),
      ('Madera y decoración', 2, 'Cuña de gatito',      'cuna-de-gatito',      'Figuras de gato y paloma.', '[{"label":null,"price":4.00,"unit":null}]'),
      ('Madera y decoración', 3, 'Pinos de madera',     'pinos-de-madera',     NULL,                        '[{"label":null,"price":15.00,"unit":null}]'),
      ('Madera y decoración', 4, 'Sagrada Familia 2D',  'sagrada-familia-2d',  NULL,                        '[{"label":null,"price":15.00,"unit":null}]'),
      ('Madera y decoración', 5, 'Sagrada Familia 3D',  'sagrada-familia-3d',  NULL,                        '[{"label":null,"price":12.00,"unit":null}]'),
      -- Galletas navideñas (1 producto, 2 presentaciones)
      ('Galletas navideñas',  1, 'Galleta navideña',    'galleta-navidena',    'Variedad de diseños.',      '[{"label":"Individual","price":1.00,"unit":null},{"label":"Caja de 10 unidades","price":9.00,"unit":null}]')
    ) AS t(line_name, ord, product_name, base_slug, description, variants)
  LOOP
    SELECT l.id INTO v_line_id
      FROM public.product_lines l
     WHERE l.catalog_id = v_catalog_id AND l.name = r.line_name;

    IF v_line_id IS NULL THEN
      RAISE EXCEPTION 'Línea no encontrada en Navidad 2026: %', r.line_name;
    END IF;

    -- No duplicar si ya existe en la misma línea
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.line_id = v_line_id AND lower(p.name) = lower(r.product_name)
    );

    -- Resolver slug único por empresa
    v_slug := r.base_slug;
    v_n := 2;
    WHILE EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.company_id = v_company AND p.slug = v_slug
    ) LOOP
      v_slug := r.base_slug || '-' || v_n;
      v_n := v_n + 1;
    END LOOP;

    INSERT INTO public.products
      (company_id, line_id, name, slug, description, is_active, featured, content_order)
    VALUES
      (v_company, v_line_id, r.product_name, v_slug, r.description, true, false, r.ord)
    RETURNING id INTO v_product_id;

    INSERT INTO public.product_variants (product_id, label, price, unit, is_available, content_order)
    SELECT
      v_product_id,
      v ->> 'label',
      (v ->> 'price')::numeric,
      v ->> 'unit',
      true,
      (ordinality - 1)::integer
    FROM jsonb_array_elements(r.variants::jsonb) WITH ORDINALITY AS e(v, ordinality);
  END LOOP;
END;
$$;
