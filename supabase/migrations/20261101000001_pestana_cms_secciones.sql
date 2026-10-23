-- Migration: Secciones del CMS para parametrizar el nombre de pestaña de cada página (section_key = 'pestaña').
-- Solo inserta lo que no exista (no sobreescribe ediciones manuales en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, content_order, is_active)
SELECT v.page::public.site_page_type, v.section_key, v.title, v.description, 0, true
  FROM (VALUES
    ('home', 'pestaña', 'Nombre de pestaña - Inicio', 'La Rioja - Centro de Formación Laboral'),
    ('quienes somos', 'pestaña', 'Nombre de pestaña - Quiénes Somos', 'Quiénes Somos | La Rioja'),
    ('programs', 'pestaña', 'Nombre de pestaña - Programas', 'Programas | La Rioja'),
    ('productos', 'pestaña', 'Nombre de pestaña - La Rioja Shop', 'La Rioja Shop | La Rioja'),
    ('bingo', 'pestaña', 'Nombre de pestaña - Bingo', 'Galería La Rioja 2026 | La Rioja'),
    ('apoyanos', 'pestaña', 'Nombre de pestaña - Apóyanos', 'Apóyanos | La Rioja'),
    ('privacidad', 'pestaña', 'Nombre de pestaña - Privacidad', 'Política de Privacidad | La Rioja'),
    ('tombola', 'pestaña', 'Nombre de pestaña - Tómbola', 'Tómbola de Cartones | La Rioja'),
    ('global', 'pestaña_faq', 'Nombre de pestaña - Preguntas Frecuentes', 'Preguntas Frecuentes | La Rioja'),
    ('global', 'pestaña_admin', 'Nombre de pestaña - Admin', 'La Rioja - Centro de Formación Laboral')
  ) AS v(page, section_key, title, description)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content s
    WHERE s.page = v.page::public.site_page_type
      AND s.section_key = v.section_key
 );
