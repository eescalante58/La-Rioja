-- ============================================================================
-- Migration: Agregar nuevo pilar «Supervisión institucional» en Apóyanos
-- ============================================================================
-- Inserta la nueva tarjeta de transparencia inmediatamente después de
-- 'apoyanos_pilar_1' (Gobernanza de las familias).
-- Reordena apoyanos_pilar_2..4 a apoyanos_pilar_3..5 e inserta apoyanos_pilar_2.
-- ============================================================================

DO $$
BEGIN
    -- Reordenar de atrás hacia adelante solo si no se ha aplicado antes
    IF NOT EXISTS (
        SELECT 1 FROM public.site_content
        WHERE page = 'apoyanos'
          AND section_key = 'apoyanos_pilar_2'
          AND title = 'Supervisión institucional'
    ) THEN
        UPDATE public.site_content
        SET section_key = 'apoyanos_pilar_5', content_order = 45, updated_at = NOW()
        WHERE page = 'apoyanos' AND section_key = 'apoyanos_pilar_4';

        UPDATE public.site_content
        SET section_key = 'apoyanos_pilar_4', content_order = 44, updated_at = NOW()
        WHERE page = 'apoyanos' AND section_key = 'apoyanos_pilar_3';

        UPDATE public.site_content
        SET section_key = 'apoyanos_pilar_3', content_order = 43, updated_at = NOW()
        WHERE page = 'apoyanos' AND section_key = 'apoyanos_pilar_2';

        INSERT INTO public.site_content (
            page,
            section_key,
            title,
            description,
            metadata,
            content_order,
            is_active
        )
        VALUES (
            'apoyanos',
            'apoyanos_pilar_2',
            'Supervisión institucional',
            'El Ministerio de Gobernación es nuestro principal supervisor y uno de los entes públicos que dan seguimiento a la ejecución de las actividades de La Rioja.

Cada año le remitimos los estados financieros auditados. Una vez presentada la memoria de labores ante la Asamblea General, le enviamos además el listado de las personas presentes en la Asamblea, junto con los estados financieros auditados.

De este modo, rendimos cuentas de manera clara y oportuna sobre el uso de nuestros recursos y el cumplimiento de nuestra labor.',
            '{}'::jsonb,
            42,
            true
        );
    END IF;
END $$;
