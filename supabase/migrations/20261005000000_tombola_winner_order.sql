-- ============================================================================
-- Tómbola La Rioja: número de orden en que se entregaron los premios
-- ----------------------------------------------------------------------------
-- winner_order = posición del premio dentro de la ruleta (1 = primer ganador).
-- Lo asigna un trigger BEFORE UPDATE cuando is_winner cambia false→true, así
-- queda grabado sin importar qué proceso marcó al ganador (incluido el
-- fallback del spin sin won_at). Si un ganador se resetea (is_winner=false),
-- el número se libera (NULL) para evitar huecos engañosos.
--
-- Ejecutar en Supabase SQL Editor DESPUÉS de
-- 20261004000000_tombola_winner_data.sql.
-- ============================================================================

ALTER TABLE public.wheel_participating_cards
  ADD COLUMN IF NOT EXISTS winner_order integer;

-- --------------------------------------------------------------------------
-- Backfill: ganadores existentes numerados por su momento de sorteo
-- (won_at; updated_at como respaldo para filas pre-migración anterior)
-- --------------------------------------------------------------------------
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY wheel_id
           ORDER BY COALESCE(won_at, updated_at), card_number
         ) AS rn
  FROM public.wheel_participating_cards
  WHERE is_winner = true
)
UPDATE public.wheel_participating_cards wpc
SET winner_order = ranked.rn
FROM ranked
WHERE wpc.id = ranked.id
  AND wpc.winner_order IS NULL;

-- --------------------------------------------------------------------------
-- Trigger: asigna el siguiente número al ganar / lo libera al resetear
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_winner_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_winner IS DISTINCT FROM OLD.is_winner THEN
    IF NEW.is_winner THEN
      SELECT COALESCE(MAX(winner_order), 0) + 1
        INTO NEW.winner_order
        FROM public.wheel_participating_cards
       WHERE wheel_id = NEW.wheel_id;
    ELSE
      NEW.winner_order := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wheel_part_winner_order
  ON public.wheel_participating_cards;

CREATE TRIGGER trg_wheel_part_winner_order
BEFORE UPDATE OF is_winner ON public.wheel_participating_cards
FOR EACH ROW EXECUTE FUNCTION public.set_winner_order();

COMMENT ON COLUMN public.wheel_participating_cards.winner_order IS 'Número de orden en que se entregó el premio dentro de la ruleta (1 = primer ganador).';
