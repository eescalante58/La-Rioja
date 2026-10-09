-- Migration: La Rioja Shop — datos de los catálogos 2025 (empresa 1).
--
-- Fuente: Planificacion/Imagenes/Productos/
--   «catalogo de Arte y Costura  2025.pptx» y «catalogo de Panadería La Rioja 2025.pptx».
-- Decisiones confirmadas (2026-10-09):
--   * Repetidos en el pptx (Tote bag floral, Toalla pez, Novias) = un producto.
--   * Tote bag mariposa y Tortilleros: variantes Pequeño / Grande.
--   * Panera de $4 sin nombre: se omite (se agrega desde el admin).
-- Las fotos se suben después desde /admin/productos.
--
-- Requiere 20261017000000_shop_catalog.sql. Idempotente: no duplica líneas ni
-- productos (mismo nombre en la misma línea) y no pisa ediciones del admin.
-- Mientras exista la fase expandir, también llena las columnas legadas
-- (category, price, unit, is_available) para que el código anterior funcione.

-- Agregado a 20261017000000_shop_catalog.sql después de su primera ejecución:
-- el código nuevo ya no escribe products.category. Idempotente.
ALTER TABLE public.products ALTER COLUMN category DROP NOT NULL;

DO $$
DECLARE
  v_company   constant bigint := 1;
  v_line_id   bigint;
  v_cat_name  text;
  v_product   uuid;
  r           record;
BEGIN
  -- --------------------------------------------------------------------------
  -- Líneas
  -- --------------------------------------------------------------------------
  INSERT INTO public.product_lines (catalog_id, name, description, slogan, content_order)
  SELECT c.id, l.name, l.description, l.slogan, l.ord
    FROM (VALUES
      ('arte-y-costura', 'Tote Bags',
       '¡Elegí llevar estilo y apoyar la formación de jóvenes! Las Tote Bags del Centro de Formación Laboral La Rioja son diseñadas y confeccionadas por estudiantes con dedicación y talento. Al comprar, no solo adquirís un producto único y funcional, sino que apoyás la educación y el futuro laboral de los jóvenes en formación.',
       '¡Usá calidad, usá conciencia!', 1),
      ('arte-y-costura', 'Toallas de mano',
       '¡Lleva calidad y compromiso a tu hogar! Toallas para mano confeccionadas con dedicación por los estudiantes. Cada pieza es fruto del aprendizaje, el esfuerzo y la pasión por el trabajo bien hecho. Hechas a mano, con materiales de primera.',
       '¡Elegí local, elegí solidario!', 2),
      ('arte-y-costura', 'Paneras',
       'Las paneras del Centro de Formación Laboral La Rioja son confeccionadas a mano por estudiantes con gran dedicación. Cada una está diseñada para mantener tu pan fresco y darle un toque único a tu hogar.',
       '¡Elige calidad, elige solidaridad!', 3),
      ('arte-y-costura', 'Productos de costura',
       'En nuestro taller, cada producto es una muestra de creatividad, dedicación y aprendizaje. Cada pieza refleja el esfuerzo y la pasión de nuestros estudiantes, que día a día desarrollan habilidades para su futuro laboral.',
       NULL, 4),
      ('panaderia', 'Nuestros productos',
       'Nuestras recetas están hechas con ingredientes simples, pero también con paciencia, aprendizaje y mucho corazón. Cada masa que amasamos es parte del proceso de formación de nuestros estudiantes.',
       'Nuestras recetas no solo alimentan: inspiran.', 1)
    ) AS l(catalog_slug, name, description, slogan, ord)
    JOIN public.product_catalogs c
      ON c.company_id = v_company AND c.slug = l.catalog_slug
  ON CONFLICT (catalog_id, name) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- Productos y variantes
  --   variants: [{label, price, unit}] — label null = presentación única.
  -- --------------------------------------------------------------------------
  FOR r IN
    SELECT * FROM (VALUES
      -- Arte y Costura · Tote Bags
      ('arte-y-costura', 'Tote Bags', 1, 'Tote bag floral',   '[{"label":null,"price":10}]'),
      ('arte-y-costura', 'Tote Bags', 2, 'Tote bag colores',  '[{"label":null,"price":10}]'),
      ('arte-y-costura', 'Tote Bags', 3, 'Tote bag rosa',     '[{"label":null,"price":15}]'),
      ('arte-y-costura', 'Tote Bags', 4, 'Tote bag caballo',  '[{"label":null,"price":20}]'),
      ('arte-y-costura', 'Tote Bags', 5, 'Tote bag gato',     '[{"label":null,"price":20}]'),
      ('arte-y-costura', 'Tote Bags', 6, 'Tote bag mariposa', '[{"label":"Pequeño","price":10},{"label":"Grande","price":15}]'),
      -- Arte y Costura · Toallas de mano
      ('arte-y-costura', 'Toallas de mano', 1, 'Toalla corazón', '[{"label":null,"price":4}]'),
      ('arte-y-costura', 'Toallas de mano', 2, 'Toalla pez',     '[{"label":null,"price":4.50}]'),
      ('arte-y-costura', 'Toallas de mano', 3, 'Toalla muñecos', '[{"label":null,"price":7}]'),
      ('arte-y-costura', 'Toallas de mano', 4, 'Toalla gato',    '[{"label":null,"price":7}]'),
      ('arte-y-costura', 'Toallas de mano', 5, 'Toalla gatos',   '[{"label":null,"price":7}]'),
      ('arte-y-costura', 'Toallas de mano', 6, 'Toalla pinos',   '[{"label":null,"price":7}]'),
      -- Arte y Costura · Paneras
      ('arte-y-costura', 'Paneras', 1, 'Panera roja', '[{"label":null,"price":7}]'),
      ('arte-y-costura', 'Paneras', 2, 'Panera café', '[{"label":null,"price":7}]'),
      -- Arte y Costura · Productos de costura
      ('arte-y-costura', 'Productos de costura', 1, 'Funda de inodoro',    '[{"label":null,"price":5.50}]'),
      ('arte-y-costura', 'Productos de costura', 2, 'Funda de microondas', '[{"label":null,"price":5}]'),
      ('arte-y-costura', 'Productos de costura', 3, 'Porta papel',         '[{"label":null,"price":3}]'),
      ('arte-y-costura', 'Productos de costura', 4, 'Tortilleros',         '[{"label":"Pequeño","price":1},{"label":"Grande","price":3}]'),
      ('arte-y-costura', 'Productos de costura', 5, 'Porta bolsas',        '[{"label":null,"price":9}]'),
      ('arte-y-costura', 'Productos de costura', 6, 'Delantal',            '[{"label":null,"price":2.50}]'),
      ('arte-y-costura', 'Productos de costura', 7, 'Porta toallas',       '[{"label":null,"price":3}]'),
      ('arte-y-costura', 'Productos de costura', 8, 'Tope de puerta',      '[{"label":null,"price":6}]'),
      ('arte-y-costura', 'Productos de costura', 9, 'Almohada',            '[{"label":null,"price":10}]'),
      -- Panadería · Nuestros productos
      ('panaderia', 'Nuestros productos',  1, 'Novias',                   '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos',  2, 'Pastelito de fresa',       '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos',  3, 'Pastelito de piña',        '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos',  4, 'Pegaditos',                '[{"label":null,"price":0.25}]'),
      ('panaderia', 'Nuestros productos',  5, 'Peperechas',               '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos',  6, 'Brazo gitano',             '[{"label":null,"price":0.65}]'),
      ('panaderia', 'Nuestros productos',  7, 'Pixi',                     '[{"label":null,"price":0.25}]'),
      ('panaderia', 'Nuestros productos',  8, 'Herradura',                '[{"label":null,"price":0.50}]'),
      ('panaderia', 'Nuestros productos',  9, 'Gusanos de jamón y queso', '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 10, 'Salpor de almidón',        '[{"label":null,"price":0.25}]'),
      ('panaderia', 'Nuestros productos', 11, 'Orejitas',                 '[{"label":null,"price":0.40}]'),
      ('panaderia', 'Nuestros productos', 12, 'Biscotela',                '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 13, 'Pan francés',              '[{"label":null,"price":0.25,"unit":"2 unidades"}]'),
      ('panaderia', 'Nuestros productos', 14, 'Semita alta',              '[{"label":null,"price":0.60}]'),
      ('panaderia', 'Nuestros productos', 15, 'Yemitas',                  '[{"label":null,"price":0.35}]'),
      ('panaderia', 'Nuestros productos', 16, 'Pastelitos de leche',      '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 17, 'Gusanos de mantequilla',   '[{"label":null,"price":0.40}]'),
      ('panaderia', 'Nuestros productos', 18, 'Viejitas',                 '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 19, 'Negritas',                 '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 20, 'Galleta sablé',            '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 21, 'Bizcocho',                 '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 22, 'Pañuelos',                 '[{"label":null,"price":0.40}]'),
      ('panaderia', 'Nuestros productos', 23, 'Canastas',                 '[{"label":null,"price":0.40}]'),
      ('panaderia', 'Nuestros productos', 24, 'Pichardón',                '[{"label":null,"price":0.25}]'),
      ('panaderia', 'Nuestros productos', 25, 'Picudas',                  '[{"label":null,"price":0.30}]'),
      ('panaderia', 'Nuestros productos', 26, 'Torta de ajonjolí',        '[{"label":null,"price":0.25}]'),
      ('panaderia', 'Nuestros productos', 27, 'Poleadas',                 '[{"label":null,"price":0.40}]'),
      ('panaderia', 'Nuestros productos', 28, 'Cacho simple',             '[{"label":null,"price":0.30}]')
    ) AS t(catalog_slug, line_name, ord, product_name, variants)
  LOOP
    SELECT l.id, c.name INTO v_line_id, v_cat_name
      FROM public.product_lines l
      JOIN public.product_catalogs c ON c.id = l.catalog_id
     WHERE c.company_id = v_company AND c.slug = r.catalog_slug AND l.name = r.line_name;

    IF v_line_id IS NULL THEN
      RAISE EXCEPTION 'Línea no encontrada: % / %', r.catalog_slug, r.line_name;
    END IF;

    -- No duplicar (mismo nombre en la misma línea, sin distinguir mayúsculas).
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.products p
       WHERE p.line_id = v_line_id AND lower(p.name) = lower(r.product_name)
    );

    -- Columnas legadas: categoría = catálogo; precio/unidad = primera variante.
    INSERT INTO public.products
      (company_id, line_id, name, category, price, unit, is_available, is_active, content_order)
    VALUES (
      v_company, v_line_id, r.product_name,
      CASE WHEN r.catalog_slug = 'panaderia' THEN 'Panadería' ELSE v_cat_name END,
      (r.variants::jsonb -> 0 ->> 'price')::numeric,
      r.variants::jsonb -> 0 ->> 'unit',
      true, true, r.ord)
    RETURNING id INTO v_product;

    INSERT INTO public.product_variants (product_id, label, price, unit, content_order)
    SELECT v_product, v ->> 'label', (v ->> 'price')::numeric, v ->> 'unit', (ordinality - 1)::integer
      FROM jsonb_array_elements(r.variants::jsonb) WITH ORDINALITY AS e(v, ordinality);
  END LOOP;
END;
$$;
