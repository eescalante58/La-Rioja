-- Migración: rediseño de la página de inicio (9 secciones) + columna featured en products.
--
-- Nuevas filas en site_content para page = 'home'. Todas llevan el prefijo
-- distintivo «cl_» en section_key para distinguirlas de los registros previos
-- (hero_main, services_intro). Los registros anteriores quedan INACTIVOS.
--
-- Secciones:
--   cl_hero               H1 + subtítulo + metadata {antetitulo, boton_1, enlace_1, boton_2, enlace_2, foto_alt}
--   cl_campaign_N         Campañas activas (1-3); metadata = json de Campaign
--   cl_stage_colegio,     Colegio y CFL
--   cl_stage_cfl
--   cl_solidarity         Banda solidaria; metadata {boton, enlace, cifras[]}
--   cl_workshops          Talleres; metadata {talleres[]}
--   cl_video              Video "Un día en La Rioja"; metadata {url, posterUrl, subtitlesUrl, visible}
--   cl_testimonial        Testimonio; metadata {quote, nombre, rol, photoUrl, visible}
--   cl_cta                Cierre; metadata {boton_whatsapp, mensaje_whatsapp, telefono_1, telefono_2, direccion}

-- ── 1. Columna featured en products ──────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.featured IS
  'true = se muestra en la sección «Compra con propósito» de la portada.';

-- ── 2. Desactivar secciones antiguas de la home (no borrar) ──────────────────
UPDATE public.site_content
  SET is_active = false
  WHERE page = 'home'::public.site_page_type
    AND section_key IN ('hero_main', 'services_intro');

-- ── 3. Contenido CMS de la nueva portada ─────────────────────────────────────
-- Solo inserta lo que no exista (idempotente).
INSERT INTO public.site_content
  (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT
  'home'::public.site_page_type,
  v.section_key,
  v.title,
  v.description,
  NULL,
  v.metadata::jsonb,
  v.ord,
  true
FROM (VALUES
  -- 1. Hero
  (
    'cl_hero',
    'Formando futuros, integrando vidas',
    'En el Centro de Formación Laboral La Rioja, jóvenes y adultos con discapacidad intelectual aprenden un oficio, ganan autonomía y construyen su lugar en la sociedad.',
    '{"antetitulo":"Desde 1993 · ASPAPREM","boton_1":"Conoce nuestros programas","enlace_1":"/programs","boton_2":"Apóyanos","enlace_2":"/apoyanos","foto_alt":"Estudiantes de La Rioja en taller"}',
    10
  ),
  -- 2a. Campaña 1: Inscripciones
  (
    'cl_campaign_1',
    'Inscripciones abiertas 2027',
    'Agenda una visita y conoce el proceso de admisión.',
    '{"tag":"Inscripciones","linkLabel":"Cómo inscribir","href":"/programs#admision","imageAlt":"Estudiantes de La Rioja en el aula"}',
    20
  ),
  -- 2b. Campaña 2: Becas
  (
    'cl_campaign_2',
    'Que el costo no sea una barrera',
    '7 de cada 10 estudiantes pagan menos del costo real. Apadrina una beca.',
    '{"tag":"Becas","linkLabel":"Apadrina un futuro","href":"/apoyanos","imageAlt":"Estudiante aprendiendo en taller"}',
    21
  ),
  -- 2c. Campaña 3: Feria de Logros (visible hasta 2026-11-30)
  (
    'cl_campaign_3',
    'Feria de Logros 2026',
    'Nuestros estudiantes te muestran todo lo que lograron este año.',
    '{"tag":"Noviembre 2026","linkLabel":"Quiero asistir","href":"https://wa.me/50377310792?text=Hola%2C+quiero+asistir+a+la+Feria+de+Logros+de+La+Rioja","imageAlt":"Productos elaborados por estudiantes","endsAt":"2026-11-30T23:59:00Z"}',
    22
  ),
  -- 3a. Etapa: Colegio La Rioja
  (
    'cl_stage_colegio',
    'Colegio La Rioja',
    'Educación formal de primero a sexto grado, avalada por el MINED, con adecuaciones de educación especial.',
    '{"edad":"De 12 a 20 años","boton":"Conocer el Colegio","enlace":"/programs#colegio","foto_alt":"Estudiantes en clase del Colegio La Rioja"}',
    30
  ),
  -- 3b. Etapa: CFL La Rioja
  (
    'cl_stage_cfl',
    'CFL La Rioja',
    'Formación laboral en talleres, vida independiente y cinco niveles según las habilidades de cada persona.',
    '{"edad":"De 20 a 55 años","boton":"Ver la ruta de formación","enlace":"/programs#niveles","foto_alt":"Estudiante trabajando en taller del CFL"}',
    31
  ),
  -- 4. Banda solidaria
  (
    'cl_solidarity',
    '7 de cada 10',
    'estudiantes pagan una cuota menor al costo real de su formación. Así nos aseguramos de que el dinero nunca sea un impedimento. Tu apoyo cubre la diferencia.',
    '{"boton":"Quiero apoyar","enlace":"/apoyanos","cifras":[{"numero":"52","etiqueta":"estudiantes en el CFL"},{"numero":"33","etiqueta":"años de ASPAPREM"},{"numero":"20","etiqueta":"profesionales"},{"numero":"+30","etiqueta":"escuelas públicas formadas"}]}',
    40
  ),
  -- 5. Talleres
  (
    'cl_workshops',
    'Aprender haciendo',
    'Talleres reales, con herramientas, ingredientes y máquinas reales.',
    '{"talleres":[{"nombre":"Panadería La Rioja","descripcion":"Cada día, nuestros estudiantes hornean pan francés, pan dulce, semitas y tortas que llegan al CNR, al colegio y a la colonia Altamira.","insignia":"Hecho por nuestros estudiantes","whatsapp":"https://wa.me/50377310792?text=Hola%2C+me+interesa+pedir+pan+de+La+Rioja+para+un+evento","foto":"/nosotros/taller-panaderia.webp","foto_alt":"Estudiantes horneando en la Panadería La Rioja","destacado":true},{"nombre":"Costura","descripcion":"Gabachas, delantales y toallas confeccionados por nuestros estudiantes.","foto":"/nosotros/taller-costura.webp","foto_alt":"Taller de costura La Rioja"},{"nombre":"Carpintería","descripcion":"Piezas de madera trabajadas con precisión y dedicación.","foto":"/nosotros/taller-carpinteria.webp","foto_alt":"Taller de carpintería La Rioja"}]}',
    50
  ),
  -- 6. Video (visible = false hasta grabar)
  (
    'cl_video',
    'Un día en La Rioja',
    'Acompaña a nuestros estudiantes en un día de clases y talleres.',
    '{"url":"","posterUrl":"","subtitlesUrl":"","visible":false}',
    60
  ),
  -- 8. Testimonio (visible = false hasta obtener consentimiento)
  (
    'cl_testimonial',
    '',
    '',
    '{"quote":"","nombre":"","rol":"","photoUrl":"","visible":false}',
    70
  ),
  -- 9. Cierre
  (
    'cl_cta',
    'Ven a conocernos',
    'Visítanos en Lomas de Altamira, conoce los talleres en funcionamiento y descubre cómo puedes ser parte.',
    '{"boton_whatsapp":"Agendar una visita","mensaje_whatsapp":"Hola%2C+me+gustar%C3%ADa+agendar+una+visita+a+La+Rioja","boton_apoyanos":"Apóyanos","enlace_apoyanos":"/apoyanos","telefono_1":"7731-0792","telefono_2":"2248-4198","direccion":"Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador"}',
    80
  )
) AS v(section_key, title, description, metadata, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content s
  WHERE s.page = 'home'::public.site_page_type
    AND s.section_key = v.section_key
);
