-- Migración: Incorporar las secciones cl_campaign_4, cl_campaign_5 y cl_campaign_6
-- en page = 'home' ("Lo que está pasando en La Rioja"), a continuación de cl_campaign_1..3
-- con content_order 23, 24 y 25, activas con contenido base institucional.

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
    'cl_campaign_4',
    'Apadrina una beca estudiantil',
    '7 de cada 10 estudiantes reciben apoyo solidario. Tu aporte mensual impulsa su formación laboral.',
    '/apoyanos/hero-apoyanos.webp',
    '{"tag":"Programa de Becas","href":"/apoyanos","imageAlt":"Estudiantes del Centro de Formación Laboral La Rioja","linkLabel":"Quiero apadrinar"}',
    23
  ),
  (
    'cl_campaign_5',
    'Productos hechos con propósito',
    'Descubre panadería artesanal, carpintería, pintura y costura elaborados en nuestros talleres vocacionales.',
    '/nosotros/taller-panaderia.webp',
    '{"tag":"La Rioja Shop","href":"/productos","imageAlt":"Productos elaborados por jóvenes en los talleres de La Rioja","linkLabel":"Visitar la tienda"}',
    24
  ),
  (
    'cl_campaign_6',
    'Voluntariado y alianzas con empresas',
    'Súmate con tu empresa o equipo en jornadas formativas, pedidos corporativos e inclusión laboral.',
    '/nosotros/taller-costura.webp',
    '{"tag":"Comunidad","href":"/apoyanos#empresas","imageAlt":"Actividades comunitarias y talleres en La Rioja","linkLabel":"Cómo participar"}',
    25
  )
) AS v(section_key, title, description, image_url, metadata, ord)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.site_content s
  WHERE s.page = 'home'::public.site_page_type
    AND s.section_key = v.section_key
);
