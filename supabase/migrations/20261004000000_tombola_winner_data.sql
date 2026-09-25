-- ============================================================================
-- Tómbola La Rioja: datos del ganador + preservación del orden de sorteo
-- ----------------------------------------------------------------------------
-- El trigger set_timestamps() actualiza updated_at en cada UPDATE, así que
-- registrar los datos del ganador rompería el orden de sorteo (que usa
-- updated_at). Por eso se agrega:
--   won_at               → momento en que el cartón salió sorteado
--   winner_registered_at → momento en que el staff registró los datos
-- y las columnas del formulario de captura en /tombola/monitor.
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

ALTER TABLE public.wheel_participating_cards
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS winner_name text,
  ADD COLUMN IF NOT EXISTS winner_prize text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS winner_phone_number text,
  ADD COLUMN IF NOT EXISTS winner_registered_at timestamptz;

-- Backfill: los ganadores previos conservan su orden de sorteo
-- (updated_at era el momento del giro hasta este cambio).
UPDATE public.wheel_participating_cards
SET won_at = updated_at
WHERE is_winner = true
  AND won_at IS NULL;

-- Orden de captura de ganadores en el monitor (staff)
CREATE INDEX IF NOT EXISTS idx_wheel_part_registered
  ON public.wheel_participating_cards (wheel_id, winner_registered_at)
  WHERE is_winner = true;

COMMENT ON COLUMN public.wheel_participating_cards.won_at IS 'Momento del sorteo (orden de lugar). No cambia al editar datos del ganador.';
COMMENT ON COLUMN public.wheel_participating_cards.winner_registered_at IS 'Momento en que el staff registró los datos del ganador (orden de captura).';
COMMENT ON COLUMN public.wheel_participating_cards.winner_name IS 'Nombre del ganador registrado por el staff.';
COMMENT ON COLUMN public.wheel_participating_cards.winner_prize IS 'Premio entregado/asignado al ganador.';
COMMENT ON COLUMN public.wheel_participating_cards.document_type IS 'Tipo de documento de identidad (DUI por defecto).';
COMMENT ON COLUMN public.wheel_participating_cards.document_number IS 'Número del documento de identidad del ganador.';
COMMENT ON COLUMN public.wheel_participating_cards.winner_phone_number IS 'Teléfono de contacto del ganador.';
