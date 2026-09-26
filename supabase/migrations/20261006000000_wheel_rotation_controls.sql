-- ============================================================================
-- Controles de giro y límite de premios por ruleta/tómbola
-- ----------------------------------------------------------------------------
-- is_automatic_rotation:
--   false = el operador gira manualmente con el botón Girar Ruleta/Tómbola.
--   true  = la pantalla pública agenda el siguiente giro automáticamente.
-- automatic_timeout_rotation:
--   Segundos de espera antes de iniciar el siguiente giro automático.
-- prizes_number:
--   Cantidad máxima de premios/giros permitidos. 0 = sin límite configurado.
-- ============================================================================

ALTER TABLE public.wheel_configs
  ADD COLUMN IF NOT EXISTS is_automatic_rotation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS automatic_timeout_rotation integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS prizes_number integer NOT NULL DEFAULT 0;

ALTER TABLE public.wheel_configs
  DROP CONSTRAINT IF EXISTS wheel_configs_automatic_timeout_rotation_check,
  DROP CONSTRAINT IF EXISTS wheel_configs_prizes_number_check;

ALTER TABLE public.wheel_configs
  ADD CONSTRAINT wheel_configs_automatic_timeout_rotation_check
    CHECK (automatic_timeout_rotation >= 0 AND automatic_timeout_rotation <= 3600),
  ADD CONSTRAINT wheel_configs_prizes_number_check
    CHECK (prizes_number >= 0);

COMMENT ON COLUMN public.wheel_configs.is_automatic_rotation IS
  'true = la página pública ejecuta los giros automáticamente; false = giro manual.';
COMMENT ON COLUMN public.wheel_configs.automatic_timeout_rotation IS
  'Segundos de espera entre giros automáticos.';
COMMENT ON COLUMN public.wheel_configs.prizes_number IS
  'Máximo de premios/giros permitidos por ruleta. 0 = sin límite.';

-- ----------------------------------------------------------------------------
-- Límite de giros en wheel_spins (ruleta /ruleta y auditoría general)
-- El bloqueo FOR UPDATE sobre wheel_configs serializa giros concurrentes de la
-- misma ruleta para que dos operadores no superen prizes_number al mismo tiempo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_wheel_spin_prize_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_prizes_number integer;
  v_spin_count integer;
BEGIN
  SELECT COALESCE(prizes_number, 0)
    INTO v_prizes_number
    FROM public.wheel_configs
   WHERE id = NEW.wheel_id
   FOR UPDATE;

  IF v_prizes_number IS NULL OR v_prizes_number <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO v_spin_count
    FROM public.wheel_spins
   WHERE wheel_id = NEW.wheel_id;

  IF v_spin_count >= v_prizes_number THEN
    RAISE EXCEPTION 'La ruleta ya completó los % premios configurados.', v_prizes_number
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wheel_spins_prize_limit ON public.wheel_spins;
CREATE TRIGGER trg_wheel_spins_prize_limit
  BEFORE INSERT ON public.wheel_spins
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_wheel_spin_prize_limit();

-- ----------------------------------------------------------------------------
-- Límite de ganadores en wheel_participating_cards (tómbola)
-- Se valida al marcar is_winner, antes de insertar la auditoría. Así nunca se
-- marca un ganador por encima del número de premios configurado.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tombola_prize_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_prizes_number integer;
  v_winner_count integer;
BEGIN
  IF NEW.is_winner IS NOT TRUE OR OLD.is_winner IS TRUE THEN
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

  SELECT COUNT(*)
    INTO v_winner_count
    FROM public.wheel_participating_cards
   WHERE wheel_id = NEW.wheel_id
     AND is_winner = true
     AND id <> NEW.id;

  IF v_winner_count >= v_prizes_number THEN
    RAISE EXCEPTION 'La tómbola ya completó los % premios configurados.', v_prizes_number
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wheel_participating_prize_limit ON public.wheel_participating_cards;
CREATE TRIGGER trg_wheel_participating_prize_limit
  BEFORE UPDATE OF is_winner ON public.wheel_participating_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tombola_prize_limit();
