-- ============================================================================
-- Registro público de cartones (tómbola modo Participantes)
-- ----------------------------------------------------------------------------
-- wheels_presents_cards: cartones auto-registrados por asistentes desde el
-- formulario público /registro (QR). A diferencia de wheel_participating_cards
-- (carga masiva admin de vendidos/donados), aquí cada fila la crea el propio
-- asistente con su nombre y teléfono.
--
-- Además amplía la llave única de wheel_participating_cards para incluir
-- wheel_id: un mismo cartón vendido puede participar en varias tómbolas
-- Cartones del mismo evento.
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. wheel_participating_cards: la unicidad pasa a ser por ruleta
--    (company_id, event_id, wheel_id, card_number). Antes bloqueaba que un
--    mismo cartón participara en dos tómbolas del mismo evento.
-- ----------------------------------------------------------------------------
ALTER TABLE public.wheel_participating_cards
  DROP CONSTRAINT IF EXISTS uq_wheel_participating;

ALTER TABLE public.wheel_participating_cards
  ADD CONSTRAINT uq_wheel_participating
  UNIQUE (company_id, event_id, wheel_id, card_number);

-- ----------------------------------------------------------------------------
-- 1. wheels_presents_cards — cartones registrados por los asistentes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wheels_presents_cards (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wheel_id              bigint NOT NULL
                        REFERENCES public.wheel_configs (id) ON DELETE CASCADE,
  company_id            bigint NOT NULL,
  event_id              citext NOT NULL,
  mode                  text   NOT NULL CHECK (mode = 'Participantes'),
  wheel_name            text   NOT NULL,
  card_number           bigint NOT NULL,
  -- Datos del asistente que registró el cartón (formulario público)
  player_name           text   NOT NULL,
  player_phone_number   text   NOT NULL,
  -- Resultado del sorteo (mismo esquema que wheel_participating_cards)
  is_winner             boolean NOT NULL DEFAULT false,
  won_at                timestamptz,
  winner_order          integer,
  winner_name           text,
  winner_prize          text,
  document_type         text,
  document_number       text,
  winner_phone_number   text,
  winner_registered_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Un cartón solo puede ser reclamado una vez por evento: el número es
  -- del comprador, sin importar en qué ruleta Participantes se registre.
  CONSTRAINT uq_wheels_presents UNIQUE (company_id, event_id, card_number),

  -- El cartón debe existir en el inventario del evento
  FOREIGN KEY (company_id, event_id, card_number)
    REFERENCES public.cards (company_id, event_id, card_number)
    ON DELETE CASCADE
);

-- Participantes aún no sorteados (consulta principal de la tómbola)
CREATE INDEX IF NOT EXISTS idx_wheels_presents_wheel
  ON public.wheels_presents_cards (wheel_id)
  WHERE is_winner = false;

-- Galería/bandeja de ganadores por ruleta
CREATE INDEX IF NOT EXISTS idx_wheels_presents_winners
  ON public.wheels_presents_cards (wheel_id)
  WHERE is_winner = true;

-- Orden de captura de datos del ganador en el monitor
CREATE INDEX IF NOT EXISTS idx_wheels_presents_registered
  ON public.wheels_presents_cards (wheel_id, winner_registered_at)
  WHERE is_winner = true;

-- ----------------------------------------------------------------------------
-- 2. RLS — lectura pública de ruletas publicadas; escritura solo staff.
--    El público NO inserta directo: entra por la función
--    register_participant_cards (SECURITY DEFINER), que es la única puerta.
-- ----------------------------------------------------------------------------
ALTER TABLE public.wheels_presents_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wheels_presents_public_read"
ON public.wheels_presents_cards FOR SELECT
USING (wheel_id IN
  (SELECT id FROM public.wheel_configs WHERE published = true));

CREATE POLICY "wheels_presents_write"
ON public.wheels_presents_cards FOR ALL TO authenticated
USING (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheels_presents_cards.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])))
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND uc.company_id = wheels_presents_cards.company_id
      AND r.name = ANY (ARRAY['admin_empresa','ventas'])));

-- ----------------------------------------------------------------------------
-- 3. Triggers — mismos que wheel_participating_cards:
--    set_timestamps reutilizable; winner_order y límite de premios llevan
--    funciones propias porque referencian la tabla por nombre.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_wheels_presents_set_timestamps
BEFORE UPDATE ON public.wheels_presents_cards
FOR EACH ROW EXECUTE FUNCTION set_timestamps();

-- Asigna/libera winner_order al marcar/desmarcar ganador
CREATE OR REPLACE FUNCTION public.set_winner_order_presents()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_winner IS DISTINCT FROM OLD.is_winner THEN
    IF NEW.is_winner THEN
      SELECT COALESCE(MAX(winner_order), 0) + 1
        INTO NEW.winner_order
        FROM public.wheels_presents_cards
       WHERE wheel_id = NEW.wheel_id;
    ELSE
      NEW.winner_order := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wheels_presents_winner_order
  ON public.wheels_presents_cards;

CREATE TRIGGER trg_wheels_presents_winner_order
BEFORE UPDATE OF is_winner ON public.wheels_presents_cards
FOR EACH ROW EXECUTE FUNCTION public.set_winner_order_presents();

-- Bloquea ganadores por encima de wheel_configs.prizes_number (FOR UPDATE
-- serializa giros concurrentes de la misma ruleta).
CREATE OR REPLACE FUNCTION public.enforce_presents_prize_limit()
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
    FROM public.wheels_presents_cards
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

DROP TRIGGER IF EXISTS trg_wheels_presents_prize_limit
  ON public.wheels_presents_cards;

CREATE TRIGGER trg_wheels_presents_prize_limit
  BEFORE UPDATE OF is_winner ON public.wheels_presents_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_presents_prize_limit();

-- ----------------------------------------------------------------------------
-- 4. Helper: motivo por el que un cartón no puede registrarse.
--    NULL = válido; 'no_existe' / 'no_vendido' / 'ya_registrado' = rechazo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.participant_card_status(
  p_company_id bigint,
  p_event_id citext,
  p_card_number bigint
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT c.card_status::text INTO v_status
    FROM public.cards c
   WHERE c.company_id = p_company_id
     AND c.event_id = p_event_id
     AND c.card_number = p_card_number;

  IF NOT FOUND THEN
    RETURN 'no_existe';
  END IF;
  IF v_status NOT IN ('Vendido', 'Donado') THEN
    RETURN 'no_vendido';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.wheels_presents_cards w
     WHERE w.company_id = p_company_id
       AND w.event_id = p_event_id
       AND w.card_number = p_card_number
  ) THEN
    RETURN 'ya_registrado';
  END IF;
  RETURN NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC register_participant_cards — única puerta de escritura pública.
--
--    Un solo round-trip por asistente ("todo o nada"): si cualquier cartón
--    falla, no se inserta ninguno y se devuelve el motivo por número.
--    Ante una carrera (dos personas registran el mismo cartón a la vez), el
--    UNIQUE bloquea hasta que la otra transacción decida; al rebotar, se
--    reevalúa cada cartón para reportar el motivo exacto.
--
--    SECURITY DEFINER + search_path fijo: el rol anon no tiene política de
--    INSERT sobre la tabla — solo puede ejecutar esta función.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_participant_cards(
  p_wheel_id      bigint,
  p_player_name   text,
  p_player_phone  text,
  p_card_numbers  bigint[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg      public.wheel_configs%ROWTYPE;
  v_cards    bigint[];
  v_card     bigint;
  v_reason   text;
  v_results  jsonb := '[]'::jsonb;
  v_failed   boolean := false;
BEGIN
  -- La ruleta debe existir, estar publicada y ser de modo Participantes
  SELECT * INTO v_cfg
    FROM public.wheel_configs
   WHERE id = p_wheel_id
     AND published = true
     AND mode = 'Participantes';
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El registro de cartones no está disponible en este momento.');
  END IF;

  -- Datos del asistente
  IF p_player_name IS NULL OR length(btrim(p_player_name)) < 2 THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Ingresa tu nombre completo.');
  END IF;
  IF length(btrim(p_player_name)) > 120 THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'El nombre es demasiado largo.');
  END IF;
  IF p_player_phone IS NULL
     OR p_player_phone !~ '^\+?[0-9][0-9 .-]{5,24}$' THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Ingresa un número de teléfono válido.');
  END IF;

  -- Cartones: 1 a 10 números únicos y positivos
  v_cards := ARRAY(
    SELECT DISTINCT n FROM unnest(p_card_numbers) AS n
     WHERE n IS NOT NULL AND n > 0);
  IF cardinality(v_cards) = 0 THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Ingresa al menos un número de cartón válido.');
  END IF;
  IF cardinality(v_cards) > 10 THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'Máximo 10 cartones por registro.');
  END IF;

  -- Validación por cartón (dentro de la misma transacción de la función)
  FOR v_card IN SELECT n FROM unnest(v_cards) AS n ORDER BY n LOOP
    v_reason := public.participant_card_status(
      v_cfg.company_id, v_cfg.event_id, v_card);
    IF v_reason IS NULL THEN
      v_results := v_results
        || jsonb_build_object('cardNumber', v_card, 'ok', true);
    ELSE
      v_results := v_results || jsonb_build_object(
        'cardNumber', v_card, 'ok', false, 'reason', v_reason);
      v_failed := true;
    END IF;
  END LOOP;

  IF v_failed THEN
    RETURN jsonb_build_object('success', false, 'results', v_results);
  END IF;

  BEGIN
    INSERT INTO public.wheels_presents_cards
      (wheel_id, company_id, event_id, mode, wheel_name,
       card_number, player_name, player_phone_number)
    SELECT v_cfg.id, v_cfg.company_id, v_cfg.event_id, 'Participantes',
           v_cfg.wheel_name, n,
           btrim(p_player_name), btrim(p_player_phone)
      FROM unnest(v_cards) AS n;
  EXCEPTION
    WHEN unique_violation OR foreign_key_violation THEN
      -- Carrera con otro envío: el ganador ya quedó visible al desbloquearse
      -- el índice único; se reevalúa para reportar el motivo exacto.
      v_results := '[]'::jsonb;
      FOR v_card IN SELECT n FROM unnest(v_cards) AS n ORDER BY n LOOP
        v_reason := public.participant_card_status(
          v_cfg.company_id, v_cfg.event_id, v_card);
        IF v_reason IS NULL THEN
          v_results := v_results
            || jsonb_build_object('cardNumber', v_card, 'ok', false,
                                  'reason', 'ya_registrado');
        ELSE
          v_results := v_results || jsonb_build_object(
            'cardNumber', v_card, 'ok', false, 'reason', v_reason);
        END IF;
      END LOOP;
      RETURN jsonb_build_object('success', false, 'results', v_results);
  END;

  RETURN jsonb_build_object('success', true, 'registered', v_cards);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Privilegios
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.register_participant_cards(bigint, text, text, bigint[])
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_participant_cards(bigint, text, text, bigint[])
  TO anon, authenticated;

GRANT SELECT ON public.wheels_presents_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wheels_presents_cards TO authenticated;
GRANT USAGE ON SEQUENCE public.wheels_presents_cards_id_seq TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. Realtime — el monitor del staff y el admin cuentan registros en vivo
-- ----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.wheels_presents_cards;

-- ----------------------------------------------------------------------------
-- 8. Comentarios
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.wheels_presents_cards IS
  'Cartones auto-registrados por asistentes (modo Participantes) desde /registro. Escritura pública solo vía register_participant_cards().';
COMMENT ON FUNCTION public.register_participant_cards(bigint, text, text, bigint[]) IS
  'Registro atómico todo-o-nada de cartones del asistente; valida existencia, estado Vendido/Donado y duplicados; retorna resultado por cartón.';
