-- ============================================================================
-- Limpieza de datos de la prueba de carga (company 1, evento TESTCARGA01)
-- Ejecutar en SQL Editor DESPUÉS de documentar resultados.
-- ============================================================================
BEGIN;

DELETE FROM public.wheels_presents_cards
 WHERE company_id = 1 AND event_id = 'TESTCARGA01';

DELETE FROM public.cards
 WHERE company_id = 1 AND event_id = 'TESTCARGA01';

DELETE FROM public.wheel_configs
 WHERE company_id = 1 AND event_id = 'TESTCARGA01';

DELETE FROM public.events
 WHERE company_id = 1 AND event_id = 'TESTCARGA01';

-- Intentos del test (opcional; expiran solos en 24h). Ajustar la fecha al
-- inicio real de la prueba:
-- DELETE FROM public.registration_attempts WHERE attempted_at > 'YYYY-MM-DD HH:MM+00';

COMMIT;
