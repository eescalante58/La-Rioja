-- Migration: Ajustar el límite de premios para ignorar segmentos sin premio
-- El contador de giros ahora solo sumará los registros donde prize_label NO sea NULL.

CREATE OR REPLACE FUNCTION public.enforce_wheel_spin_prize_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_prizes_number integer;
  v_prize_count integer;
BEGIN
  -- Si el nuevo registro NO es un premio (prize_label IS NULL), permitimos el insert
  -- sin importar el límite de prizes_number.
  IF NEW.prize_label IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(prizes_number, 0)
    INTO v_prizes_number
    FROM public.wheel_configs
   WHERE id = NEW.wheel_id
   FOR UPDATE;

  IF v_prizes_number IS NULL OR v_prizes_number <= 0 THEN
    RETURN NEW;
  END IF;

  -- Contamos solo los giros que efectivamente otorgaron un premio
  SELECT COUNT(*)
    INTO v_prize_count
    FROM public.wheel_spins
   WHERE wheel_id = NEW.wheel_id
     AND prize_label IS NOT NULL;

  IF v_prize_count >= v_prizes_number THEN
    RAISE EXCEPTION 'La ruleta ya completó los % premios configurados.', v_prizes_number
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_wheel_spin_prize_limit() IS 
'Valida que no se superen los premios configurados, ignorando giros sin premio (Sigue participando).';
