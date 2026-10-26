-- Migration: Matrícula 2027 - Fase 2: Índice único parcial y Seed de 19 filas de CMS
-- 1. Índice parcial de unicidad para claves de la página 'matricula'
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_matricula_unique 
  ON public.site_content (page, section_key) 
  WHERE (page = 'matricula');

-- 2. Inserción de las 19 filas iniciales (idempotente: no sobrescribe ediciones manuales previas)
INSERT INTO public.site_content (page, section_key, title, description, image_url, content_order, is_active, metadata)
SELECT 
  v.page::public.site_page_type, 
  v.section_key, 
  v.title, 
  v.description, 
  v.image_url, 
  v.content_order, 
  v.is_active, 
  v.metadata::jsonb
FROM (VALUES
  (
    'matricula', 
    'pestaña', 
    'Matrícula', 
    'Matrícula 2027 | La Rioja', 
    NULL, 
    0, 
    false, 
    '{}'
  ),
  (
    'matricula', 
    'matricula_intro', 
    'Admisiones e Inscripciones 2027', 
    'Centro de Formación Laboral y Colegio La Rioja', 
    NULL, 
    10, 
    true, 
    '{"cta_label": "Consultar admisión", "cta_aria_label": "Consultar admisión por WhatsApp", "show_cta": true}'
  ),
  (
    'matricula', 
    'matricula_hero', 
    'MATRÍCULA {year}', 
    'Educación y formación laboral para personas con discapacidad intelectual.', 
    '/logo.svg', 
    20, 
    true, 
    '{"eyebrow": "Admisiones Abiertas", "image_alt": "Estudiantes de La Rioja en actividades formativas", "image_position": "right", "cta_label": "Consultar por WhatsApp", "cta_aria_label": "Consultar por WhatsApp sobre matrícula", "secondary_label": "Conoce el proceso", "secondary_anchor": "#proceso"}'
  ),
  (
    'matricula', 
    'matricula_cupos', 
    '{count} cupos disponibles', 
    'Cupos limitados para el ciclo escolar 2027', 
    NULL, 
    30, 
    true, 
    '{"count": 23, "show_count": true, "zero_label": "Cupos agotados", "updated_label": "Actualizado recientemente", "last_verified_at": "2026-10-25T15:00:00Z"}'
  ),
  (
    'matricula', 
    'matricula_programas', 
    'Colegio y CFL', 
    'Dos modalidades diseñadas para potenciar la autonomía, el aprendizaje y la inclusión laboral.', 
    NULL, 
    40, 
    true, 
    '{"layout_variant": "cards", "show_intro": true}'
  ),
  (
    'matricula', 
    'matricula_programa_colegio', 
    'Colegio', 
    'Conoce nuestra propuesta educativa adaptada para jóvenes de 12 a 20 años.', 
    NULL, 
    41, 
    true, 
    '{"icon": "GraduationCap", "image_alt": "Colegio La Rioja", "link_label": "Conocer Colegio", "link_href": "/programs#colegio", "show_link": true}'
  ),
  (
    'matricula', 
    'matricula_programa_cfl', 
    'Centro de Formación Laboral', 
    'Consulta nuestras opciones de formación vocacional para personas de 20 a 55 años.', 
    NULL, 
    42, 
    true, 
    '{"icon": "Briefcase", "image_alt": "Centro de Formación Laboral", "link_label": "Conocer CFL", "link_href": "/programs#cfl", "show_link": true}'
  ),
  (
    'matricula', 
    'matricula_proceso', 
    'Tu próximo paso', 
    'Un proceso cercano y transparente para acompañar a tu familia en cada etapa.', 
    NULL, 
    50, 
    true, 
    '{"layout_variant": "steps", "anchor": "proceso"}'
  ),
  (
    'matricula', 
    'matricula_paso_01', 
    'Escríbenos', 
    'Inicia tu consulta a través de nuestro formulario o WhatsApp directo.', 
    NULL, 
    51, 
    true, 
    '{"icon": "MessageCircle", "step_number": 1}'
  ),
  (
    'matricula', 
    'matricula_paso_02', 
    'Consulta requisitos', 
    'Te orientamos sobre la documentación y el perfil de ingreso requerido.', 
    NULL, 
    52, 
    true, 
    '{"icon": "FileText", "step_number": 2}'
  ),
  (
    'matricula', 
    'matricula_paso_03', 
    'Coordina una visita', 
    'Visita nuestras instalaciones y conoce de cerca a nuestros docentes y talleres.', 
    NULL, 
    53, 
    true, 
    '{"icon": "Calendar", "step_number": 3}'
  ),
  (
    'matricula', 
    'matricula_cierre', 
    'Conversemos sobre el ingreso', 
    'Nuestro equipo de admisiones está disponible para resolver tus dudas y acompañar a tu familia.', 
    NULL, 
    60, 
    true, 
    '{"image_alt": "Admisiones La Rioja", "cta_label": "Consultar por WhatsApp", "cta_aria_label": "Consultar por WhatsApp sobre matrícula", "show_phone": true}'
  ),
  (
    'matricula', 
    'matricula_cta_movil', 
    'Consultar por WhatsApp', 
    NULL, 
    NULL, 
    80, 
    true, 
    '{"aria_label": "Consultar por WhatsApp sobre matrícula", "sticky_enabled": true, "visibility_mode": "mobile"}'
  ),
  (
    'matricula', 
    'matricula_formulario', 
    'Formulario de Contacto', 
    'Guardaremos tu solicitud y prepararemos un mensaje para WhatsApp. Confirma el envío en WhatsApp.', 
    '/logo.svg', 
    85, 
    true, 
    '{"logo_alt": "La Rioja Centro de Formación Laboral", "field_labels": {"name": "Nombre Completo", "email": "Correo Electrónico", "phone": "Teléfono (opcional)", "type": "Tipo de Consulta", "message": "Mensaje"}, "field_placeholders": {"name": "Tu nombre y apellido", "email": "ejemplo@correo.com", "phone": "7000-0000", "message": "Cuéntanos sobre el aspirante o tus inquietudes..."}, "help_texts": {"phone": "No obligatorio, pero nos facilita contactarte directamente si es necesario."}, "inquiry_options": ["Información de Inscripción", "Colegio La Rioja (12-20 años)", "Centro de Formación Laboral (20-55 años)", "Visita guiada a instalaciones", "Otra consulta"], "default_inquiry": "Información de Inscripción", "submit_label": "Guardar y continuar", "success_title": "Solicitud guardada", "success_description": "Continúa a WhatsApp para enviar tu mensaje.", "whatsapp_link_label": "Abrir WhatsApp", "privacy_label": "Política de privacidad", "privacy_href": "/privacidad", "close_aria_label": "Cerrar formulario", "schema_version": 1}'
  ),
  (
    'matricula', 
    'matricula_config', 
    'Configuración de Matrícula', 
    'Registro técnico del módulo de admisiones', 
    NULL, 
    900, 
    true, 
    '{"schema_version": 1, "admission_year": 2027, "route": "/matricula", "theme_variant": "default", "contact_fallback_text": "Solicitud de información sobre matrícula 2027"}'
  ),
  (
    'matricula', 
    'matricula_whatsapp', 
    'Configuración WhatsApp', 
    'Número y plantilla para continuidad de mensajes', 
    NULL, 
    910, 
    true, 
    '{"phone_e164": "+50377310792", "display_phone": "7731-0792", "message_template": "Solicitud de matrícula {year}\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone}\nConsulta: {type}\nMensaje: {message}", "open_mode": "same_tab", "enabled": true}'
  ),
  (
    'matricula', 
    'matricula_seo', 
    'Matrícula 2027 | La Rioja', 
    'Admisiones e inscripciones 2027 para Colegio y Centro de Formación Laboral La Rioja. Educación inclusiva y formación para la vida autónoma.', 
    '/logo.svg', 
    920, 
    true, 
    '{"og_image_alt": "Matrícula 2027 La Rioja", "canonical_path": "/matricula", "robots_index": true, "robots_follow": true}'
  ),
  (
    'matricula', 
    'matricula_ads', 
    'Medición Google Ads', 
    'Etiqueta declarativa y conversión Website lead', 
    NULL, 
    930, 
    true, 
    '{"schema_version": 1, "enabled": false, "tag_id": "AW-18533492300", "page_tag_enabled": true, "allowed_path": "/matricula", "conversion_enabled": false, "conversion_label": "-252CIjfxqgdEMzMuoVF", "conversion_action_name": "Website lead", "conversion_event": "conversion", "conversion_value": null, "currency": "USD", "cta_positions": ["intro", "hero", "cierre", "sticky_mobile"], "allow_ad_personalization_signals": false, "allow_enhanced_conversions": false, "restricted_data_processing": true, "production_only": true}'
  ),
  (
    'matricula', 
    'matricula_utm', 
    'Parámetros UTM y Atribución', 
    'Configuración de captura y origen de solicitudes', 
    NULL, 
    940, 
    true, 
    '{"schema_version": 1, "enabled": true, "campaign_defaults": {"source": "google", "medium": "cpc", "campaign": "matricula_2027"}, "optional_defaults": {"utm_id": "{campaignid}", "utm_content": "{creative}"}, "allowed_keys": ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_content", "utm_term"], "approved_sources": ["google"], "approved_campaigns": ["matricula_2027"], "capture_model": "last_explicit_utm_in_session", "storage_mode": "session", "ttl_minutes": 30, "persist_to_submission": true, "include_in_whatsapp": false}'
  )
) AS v(page, section_key, title, description, image_url, content_order, is_active, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content s
  WHERE s.page = v.page::public.site_page_type
    AND s.section_key = v.section_key
);
