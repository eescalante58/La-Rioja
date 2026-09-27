-- ============================================================================
-- OPERACIÓN POST-EVENTO — Restaurar rate limits normales del registro
-- ----------------------------------------------------------------------------
-- CUÁNDO: ejecutar en SQL Editor DESPUÉS de cerrar el registro de cartones.
--
-- CÓMO: este archivo es solo el recordatorio operativo — la versión normal
-- canónica (10 envíos/min, 40 cartones/día por IP, 30 por teléfono) vive en:
--
--     supabase/migrations/20261007000002_registration_rate_limit.sql
--
-- Acción: copiar TODO el contenido de ese archivo y ejecutarlo aquí en el
-- SQL Editor. Vuelve a crear la función con los límites originales
-- (CREATE OR REPLACE es idempotente).
--
-- VERIFICAR: node --env-file=.env.local loadtest/probe-xff.mjs
--            → con límites restaurados, la llamada 11 en adelante devuelve
--              'LIMITED' (Demasiados intentos).
-- ============================================================================

-- Referencia rápida de verificación en SQL (debe devolver los valores
-- normales en el cuerpo de la función):
SELECT
  proname,
  position('C_MAX_ATTEMPTS_MINUTE constant integer := 10' IN prosrc) > 0
    AS limites_normales
FROM pg_proc
WHERE proname = 'register_participant_cards';
