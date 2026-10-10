-- Migration: contenido CMS de /productos (La Rioja Shop).
--
-- Secciones editables en Gestión CMS → página «Productos (La Rioja Shop)»:
--   productos_hero          título, descripción y metadata
--                           {badge, boton_1, boton_1_enlace, boton_2, boton_2_enlace}
--   productos_hero_foto_N   fotos del hero (imagen + título = texto alternativo).
--                           Sin fotos, la página usa fotos de productos del catálogo.
--   productos_mensaje       «Cada compra apoya su formación»
--   productos_regalos       tarjeta de regalos empresariales; metadata
--                           {etiqueta, boton, mensaje_whatsapp}. Desactivar = ocultar.
--   productos_como_comprar  título de «Cómo comprar» (desactivar = ocultar la sección)
--   productos_paso_N        pasos de «Cómo comprar» (título + descripción), por orden.
--
-- Solo inserta lo que no exista (no pisa ediciones hechas en el CMS).

INSERT INTO public.site_content (page, section_key, title, description, image_url, metadata, content_order, is_active)
SELECT v.page::public.site_page_type, v.section_key, v.title, v.description, NULL, v.metadata::jsonb, v.ord, true
  FROM (VALUES
    ('productos', 'productos_hero',
     'Pan con propósito, arte y costura con oficio',
     'Todo lo que ves lo elaboran los estudiantes de los talleres de panadería, arte y costura de La Rioja. Cada compra apoya su formación y su futuro laboral.',
     '{"badge": "Hecho a mano en San Salvador · Colección 2025", "boton_1": "Ver productos", "boton_1_enlace": "#catalogo", "boton_2": "Regalos para empresas", "boton_2_enlace": "#regalos"}',
     1),
    ('productos', 'productos_hero_foto_1', 'Pan dulce del taller de panadería', NULL, '{}', 2),
    ('productos', 'productos_hero_foto_2', 'Tote bag pintada a mano', NULL, '{}', 3),
    ('productos', 'productos_hero_foto_3', 'Toallas de mano con apliques', NULL, '{}', 4),
    ('productos', 'productos_hero_foto_4', 'Orejitas del taller de panadería', NULL, '{}', 5),
    ('productos', 'productos_mensaje',
     'Cada compra apoya su formación',
     'Lo recaudado se reinvierte en los talleres y programas de formación laboral para personas con discapacidad intelectual.',
     '{}', 10),
    ('productos', 'productos_regalos',
     'Regalos empresariales con impacto',
     'Arma regalos para tu equipo o tus clientes con tote bags, toallas de mano, paneras y pan dulce de nuestro taller. Una forma concreta de sumar a tu programa de responsabilidad social.',
     '{"etiqueta": "Temporada navideña", "boton": "Cotizar regalos", "mensaje_whatsapp": "Hola, quiero cotizar regalos empresariales de La Rioja Shop."}',
     20),
    ('productos', 'productos_como_comprar', 'Cómo comprar', NULL, '{}', 30),
    ('productos', 'productos_paso_1', 'Arma tu canasta',
     'Agrega a tu canasta los productos y cantidades que quieras.', '{}', 31),
    ('productos', 'productos_paso_2', 'Registra tu pedido',
     'Deja tu nombre y teléfono, y envíanos el pedido por WhatsApp con un clic.', '{}', 32),
    ('productos', 'productos_paso_3', 'Retira o recibe',
     'Te confirmamos disponibilidad, total y forma de pago, y coordinamos la entrega.', '{}', 33)
  ) AS v(page, section_key, title, description, metadata, ord)
 WHERE NOT EXISTS (
   SELECT 1 FROM public.site_content s
    WHERE s.page = v.page::public.site_page_type AND s.section_key = v.section_key
 );
