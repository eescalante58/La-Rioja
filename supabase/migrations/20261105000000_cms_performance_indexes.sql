-- ============================================================================
-- Migración: Índices de rendimiento para Gestión CMS y tablas asociadas
-- Optimiza ordenamiento, JOINs y filtrado en site_content, faqs, faq_sections y event_gallery.
-- ============================================================================

-- 1. Tabla faqs: acelerar JOIN por clave foránea con faq_sections
CREATE INDEX IF NOT EXISTS idx_faqs_section_id
  ON public.faqs (section_id);

-- 2. Tabla faqs: acelerar ordenamiento de preguntas por posición
CREATE INDEX IF NOT EXISTS idx_faqs_content_order
  ON public.faqs (content_order ASC);

-- 3. Tabla faq_sections: acelerar ordenamiento de categorías/secciones
CREATE INDEX IF NOT EXISTS idx_faq_sections_content_order
  ON public.faq_sections (content_order ASC);

-- 4. Tabla event_gallery: índice para consulta de imágenes ordenadas por fecha reciente
CREATE INDEX IF NOT EXISTS idx_event_gallery_created_at
  ON public.event_gallery (created_at DESC);

-- 5. Tabla event_gallery: índice compuesto para consultas acotadas a un evento
CREATE INDEX IF NOT EXISTS idx_event_gallery_event_order
  ON public.event_gallery (event_id, content_order ASC);

-- 6. Tabla site_content: índice compuesto para la consulta administrativa general
CREATE INDEX IF NOT EXISTS idx_site_content_admin_order
  ON public.site_content (page ASC, section_key ASC, content_order ASC);

-- 7. Tabla site_content: índice compuesto para consultas públicas filtradas y ordenadas
CREATE INDEX IF NOT EXISTS idx_site_content_page_active_order
  ON public.site_content (page, is_active, content_order ASC);
