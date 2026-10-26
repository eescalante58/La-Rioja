-- ============================================================================
-- Migration: Agregar nuevo logro «Jardineras remodeladas!» en Apóyanos
-- ============================================================================
-- Inserta la sección 'apoyanos_logro_9' con content_order = 60
-- y actualiza 'apoyanos_compromiso' a content_order = 61.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.site_content
        WHERE page = 'apoyanos'
          AND section_key = 'apoyanos_logro_9'
    ) THEN
        UPDATE public.site_content
        SET content_order = 61, updated_at = NOW()
        WHERE page = 'apoyanos' AND section_key = 'apoyanos_compromiso';

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
        VALUES (
            'apoyanos',
            'apoyanos_logro_9',
            'Jardineras remodeladas!',
            'Jardineras remodeladas!',
            NULL,
            '{}'::jsonb,
            60,
            true
        );
    END IF;
END $$;
