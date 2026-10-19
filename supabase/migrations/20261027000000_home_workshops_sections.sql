-- Migración: Separar los 4 talleres de cl_workshops (page = 'home') en secciones individuales
-- (cl_workshop_1 a cl_workshop_4) para permitir editar título, descripción, imagen y orden
-- directamente desde el administrador CMS (/admin/cms).
-- Idempotente: actualiza cl_workshops como encabezado e inserta/actualiza cl_workshop_1..4.

-- 1. Limpiar metadata de la fila encabezado cl_workshops
UPDATE public.site_content
SET
  title = COALESCE(NULLIF(TRIM(title), ''), 'Aprender haciendo'),
  description = COALESCE(
    NULLIF(TRIM(description), ''),
    'Cada taller es un espacio de trabajo real. Los productos que ves son hechos por nuestros estudiantes.'
  ),
  metadata = jsonb_build_object(
    'antetitulo', 'Formación Vocacional',
    'enlace', '/programs#talleres'
  ),
  content_order = 50,
  updated_at = now()
WHERE page = 'home'::public.site_page_type
  AND section_key = 'cl_workshops';

-- 2. Insertar o actualizar las 4 secciones individuales de talleres (cl_workshop_1 a cl_workshop_4)
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
  'home'::public.site_page_type,
  v.section_key,
  v.title,
  v.description,
  v.image_url,
  v.metadata::jsonb,
  v.ord,
  true
FROM (VALUES
  (
    'cl_workshop_1',
    'Panadería',
    'Preparan masas, hornean y empacan pan dulce y salado siguiendo recetas e higiene de una panadería real.',
    '/nosotros/taller-panaderia.webp',
    '{"insignia":"Taller insignia","enlace":"/productos#panaderia","enlace_texto":"Ver Panadería La Rioja →","foto_alt":"Alumnos amasando pan en el taller de Panadería","chips":["🥖 Pan francés","🍞 Pan dulce","🍪 galletas decoradas"]}',
    51
  ),
  (
    'cl_workshop_2',
    'Pintura',
    'Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.',
    '/apoyanos/cltaller8Pintura.jpeg',
    '{"insignia":"Taller Productivo","enlace":"/productos","enlace_texto":"Ver en La Rioja Shop →","foto_alt":"Alumno pintando a mano en el taller de Pintura","chips":["🎨 Llaveros ilustrados","🧢 gorras","👕 camisetas, etc."]}',
    52
  ),
  (
    'cl_workshop_3',
    'Carpintería',
    'Miden, cortan, lijan y ensamblan piezas de madera usando herramientas con técnicas seguras.',
    '/nosotros/taller-carpinteria.webp',
    '{"insignia":"Taller Productivo","enlace":"/productos","enlace_texto":"Ver en La Rioja Shop →","foto_alt":"Alumno trabajando madera en el taller de Carpintería","chips":["📦 Cajas","🪵 Repisas","🪴 Artículos decorativos"]}',
    53
  ),
  (
    'cl_workshop_4',
    'Costura',
    'Aprenden a usar la máquina de coser, cortar patrones y terminar prendas y accesorios textiles.',
    '/nosotros/taller-costura.webp',
    '{"insignia":"Taller Productivo","enlace":"/productos#arte-y-costura","enlace_texto":"Ver en La Rioja Shop →","foto_alt":"Alumnas cosiendo en el taller de Costura","chips":["👜 Bolsas","🧵 Accesorios textiles","🪡 Arreglos"]}',
    54
  )
) AS v(section_key, title, description, image_url, metadata, ord)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.site_content s
  WHERE s.page = 'home'::public.site_page_type
    AND s.section_key = v.section_key
);
