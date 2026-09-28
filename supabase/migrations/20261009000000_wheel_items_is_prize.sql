-- ============================================================================
-- Segmentos "sin premio" en ruletas modo Premios
-- ----------------------------------------------------------------------------
-- is_prize = false marca los segmentos de relleno (ej. "Sigue participando"):
-- - Participan siempre en la ruleta aunque quantity llegue a 0 (no tienen
--   stock; el filtro quantity>0 solo aplica a is_prize = true).
-- - Al resultar ganadores no descuentan stock y se registran en wheel_spins
--   con prize_label = NULL (no hubo premio).
-- - saveWheelItems los intercala aleatoriamente entre los segmentos con
--   premio garantizando que no queden adyacentes (uno por hueco del círculo).
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

ALTER TABLE public.wheel_items
  ADD COLUMN IF NOT EXISTS is_prize boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.wheel_items.is_prize IS
  'false = segmento sin derecho a premio (modo Premios): no descuenta stock, no otorga premio y se intercala sin adyacentes al guardar.';
