-- Migration: filas CMS para las secciones Talleres y Habilidades del rediseño
-- de /programs (spec §6.4, oct 2026).
--
-- Agrega 8 filas nuevas (4 talleres productivos + 4 habilidades para la vida
-- independiente) que alimentan SeccionTalleres y SeccionHabilidades.
--
-- Nomenclatura:
--   cl_taller_{id}    — taller productivo (Panadería, Carpintería, Costura, Pintura)
--   cl_habilidad_{id} — habilidad para la vida independiente (Huerto, Computación,
--                       Cocina, Artística)
--
-- Campos de metadata por fila de taller:
--   encuadre       "completa" | "recortada"  — modo de encuadre de MarcoFoto
--   foco           CSS object-position        — solo en modo "recortada"
--   foto           ruta pública /public       — fallback si image_url está vacío
--   foto_alt       texto alternativo de la imagen
--   productos      array JSON de strings      — lista de artículos que elaboran
--   tienda_etiqueta texto del botón hacia la tienda
--   tienda_href    ruta interna o ancla       — destino del botón
--
-- Los campos tienda_* y productos no aplican a las filas cl_habilidad_*.
-- image_url: NULL en la migración inicial; se llena cuando el admin sube una
--   foto desde /admin/cms y toma prioridad automática sobre metadata.foto.
--
-- Solo inserta lo que no exista (no pisa ediciones ya hechas en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT
  'programs'::public.site_page_type,
  v.section_key,
  v.title,
  v.description,
  NULL,
  v.metadata::jsonb,
  v.ord,
  true
FROM (
  VALUES
    -- ── Talleres productivos ──────────────────────────────────────────────────
    (
      'cl_taller_panaderia',
      'Panadería',
      'Preparan masas, hornean y empacan pan dulce y salado siguiendo recetas e higiene de una panadería real.',
      '{"encuadre":"recortada","foco":"50% 40%","foto":"/programas/hero-panaderia.webp","foto_alt":"Alumnos amasando pan en el taller de Panadería","productos":["Pan dulce","Pan francés","Repostería"],"tienda_etiqueta":"Ver Panadería La Rioja","tienda_href":"/productos#panaderia"}',
      10
    ),
    (
      'cl_taller_carpinteria',
      'Carpintería',
      'Miden, cortan, lijan y ensamblan piezas de madera usando herramientas con técnicas seguras.',
      '{"encuadre":"recortada","foto":"/nosotros/taller-carpinteria.webp","foto_alt":"Alumno trabajando madera en el taller de Carpintería","productos":["Cajas","Repisas","Artículos decorativos"],"tienda_etiqueta":"Ver en La Rioja Shop","tienda_href":"/productos"}',
      20
    ),
    (
      'cl_taller_costura',
      'Costura',
      'Aprenden a usar la máquina de coser, cortar patrones y terminar prendas y accesorios textiles.',
      '{"encuadre":"recortada","foto":"/nosotros/taller-costura.webp","foto_alt":"Alumnas cosiendo en el taller de Costura","productos":["Bolsas","Accesorios textiles","Arreglos"],"tienda_etiqueta":"Ver en La Rioja Shop","tienda_href":"/productos#arte-y-costura"}',
      30
    ),
    (
      'cl_taller_pintura',
      'Pintura',
      'Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.',
      '{"encuadre":"completa","foto":"/apoyanos/logro-pintura.webp","foto_alt":"Alumno pintando a mano en el taller de Pintura","productos":["Llaveros","Camisas","Gorras"],"tienda_etiqueta":"Ver en La Rioja Shop","tienda_href":"/productos"}',
      40
    ),
    -- ── Habilidades para la vida independiente ───────────────────────────────
    (
      'cl_habilidad_huerto',
      'Huerto',
      'Siembran, riegan y cosechan, aprendiendo constancia y cuidado del entorno.',
      '{"encuadre":"recortada","foto":"/nosotros/cierre-taller.webp","foto_alt":"Alumnos trabajando en el huerto escolar"}',
      10
    ),
    (
      'cl_habilidad_computacion',
      'Computación',
      'Usan la computadora y el teléfono para comunicarse, buscar información y hacer trámites.',
      '{"encuadre":"recortada","foto":"/nosotros/taller-computacion.webp","foto_alt":"Alumna usando la computadora en el taller de Computación"}',
      20
    ),
    (
      'cl_habilidad_cocina',
      'Cocina',
      'Preparan comidas sencillas y aprenden a planificar, medir y mantener limpia la cocina.',
      '{"encuadre":"recortada","foto":"/apoyanos/logro-comedor.webp","foto_alt":"Alumnos preparando alimentos en el área de Cocina"}',
      30
    ),
    (
      'cl_habilidad_artistica',
      'Artística',
      'Expresan ideas y emociones con dibujo, música y manualidades, y ganan confianza en sí mismos.',
      '{"encuadre":"completa","foto":"/nosotros/hero-estudiantes.webp","foto_alt":"Alumnos en actividad artística"}',
      40
    )
) AS v (section_key, title, description, metadata, ord)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.site_content sc
  WHERE sc.page = 'programs'::public.site_page_type
    AND sc.section_key = v.section_key
);
