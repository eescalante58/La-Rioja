-- ============================================================================
-- Anti-abuso del registro público de cartones (/registro)
-- ----------------------------------------------------------------------------
-- register_participant_cards() es ejecutable por el rol anon: sin protección,
-- cualquiera podría enumerar números de cartón y registrarlos con datos falsos
-- antes que los asistentes reales, bloqueando la tómbola.
--
-- Defensas añadidas (todas dentro del RPC, no dependen del frontend):
--   1. registration_attempts: log de intentos por IP (cabecera
--      x-forwarded-for que fija PostgREST/Supabase). Sin políticas RLS: solo
--      la función SECURITY DEFINER escribe/lee.
--   2. Ráfaga: máx 10 envíos por IP por minuto (protege la BD y la ráfaga de
--      bots; 10 es holgado para usuarios reales incluso tras CGNAT).
--   3. Tope diario: máx 40 cartones registrados por IP+evento en 24 h
--      (registered_ip en wheels_presents_cards sirve de auditoría).
--   4. Tope por teléfono: máx 30 cartones por número+evento.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Log de intentos (auditoría + ventana de ráfaga)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_ip    text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip_time
  ON public.registration_attempts (client_ip, attempted_at DESC);

-- RLS sin políticas: nadie lee ni escribe la tabla directamente; la función
-- (SECURITY DEFINER, dueña del esquema) es la única puerta.
ALTER TABLE public.registration_attempts ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. IP del registrante en la fila creada (auditoría del evento)
-- ----------------------------------------------------------------------------
ALTER TABLE public.wheels_presents_cards
  ADD COLUMN IF NOT EXISTS registered_ip text;

COMMENT ON COLUMN public.wheels_presents_cards.registered_ip IS
  'IP del cliente que registró el cartón (x-forwarded-for). Auditoría anti-abuso; no se expone al público.';

-- ----------------------------------------------------------------------------
-- 3. RPC con límites de ráfaga y acumulados
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
  v_ids      bigint[];
  v_card     bigint;
  v_reason   text;
  v_results  jsonb := '[]'::jsonb;
  v_failed   boolean := false;
  -- Anti-abuso
  v_ip            text;
  v_headers       text;
  v_recent        integer;
  v_today_cards   integer;
  v_phone_cards   integer;
  -- Límites: holgados para asistentes reales (incluso tras CGNAT), estrictos
  -- contra enumeración masiva de cartones.
  C_MAX_ATTEMPTS_MINUTE constant integer := 10; -- envíos/min por IP
  C_MAX_CARDS_DAY_IP    constant integer := 40; -- cartones/día por IP+evento
  C_MAX_CARDS_PHONE     constant integer := 30; -- cartones por teléfono+evento
BEGIN
  -- IP real del cliente (PostgREST expone las cabeceras como JSON en el GUC
  -- request.headers). Si falta, todo acceso no-PostgREST comparte el bucket
  -- 'desconocido', que queda igualmente limitado.
  BEGIN
    v_headers := current_setting('request.headers', true);
    IF v_headers IS NOT NULL THEN
      v_ip := NULLIF(btrim(split_part(
        v_headers::jsonb ->> 'x-forwarded-for', ',', 1)), '');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;
  v_ip := COALESCE(v_ip, 'desconocido');

  -- Cada llamada cuenta como intento, tenga éxito o no.
  INSERT INTO public.registration_attempts (client_ip) VALUES (v_ip);

  -- Retención: los intentos solo sirven para la ventana de ráfaga.
  DELETE FROM public.registration_attempts
   WHERE attempted_at < now() - interval '1 day';

  -- Ráfaga: demasiados envíos seguidos desde la misma IP
  SELECT COUNT(*) INTO v_recent
    FROM public.registration_attempts
   WHERE client_ip = v_ip
     AND attempted_at > now() - interval '1 minute';

  IF v_recent > C_MAX_ATTEMPTS_MINUTE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Demasiados intentos. Espera un momento e inténtalo de nuevo.');
  END IF;

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

  -- Tope por teléfono: un mismo número no puede acumular cartones sin límite
  SELECT COUNT(*) INTO v_phone_cards
    FROM public.wheels_presents_cards
   WHERE company_id = v_cfg.company_id
     AND event_id = v_cfg.event_id
     AND player_phone_number = btrim(p_player_phone);

  IF v_phone_cards + cardinality(v_cards) > C_MAX_CARDS_PHONE THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este número de teléfono ya alcanzó el máximo de cartones '
               || 'registrados para el evento.');
  END IF;

  -- Tope diario por IP: nadie puede registrar cartones masivamente
  SELECT COUNT(*) INTO v_today_cards
    FROM public.wheels_presents_cards
   WHERE company_id = v_cfg.company_id
     AND event_id = v_cfg.event_id
     AND registered_ip = v_ip
     AND created_at > now() - interval '24 hours';

  IF v_today_cards + cardinality(v_cards) > C_MAX_CARDS_DAY_IP THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Se alcanzó el límite de registros por hoy. '
               || 'Si crees que es un error, contacta al staff.');
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
    WITH ins AS (
      INSERT INTO public.wheels_presents_cards
        (wheel_id, company_id, event_id, mode, wheel_name,
         card_number, player_name, player_phone_number, registered_ip)
      SELECT v_cfg.id, v_cfg.company_id, v_cfg.event_id, 'Participantes',
             v_cfg.wheel_name, n,
             btrim(p_player_name), btrim(p_player_phone), v_ip
        FROM unnest(v_cards) AS n
      RETURNING id
    )
    SELECT array_agg(id ORDER BY id) INTO v_ids FROM ins;
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

  RETURN jsonb_build_object(
    'success', true,
    'registered', v_cards,
    'confirmationIds', v_ids);
END;
$$;

COMMENT ON FUNCTION public.register_participant_cards(bigint, text, text, bigint[]) IS
  'Registro atómico todo-o-nada de cartones del asistente; valida existencia, estado Vendido/Donado y duplicados; aplica límites anti-abuso por IP (ráfaga y tope diario) y por teléfono; retorna resultado por cartón y los ids de registro como folio de confirmación.';
