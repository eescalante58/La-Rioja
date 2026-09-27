-- ============================================================================
-- Límites anti-abuso del registro público PARAMETRIZADOS en tabla
-- ----------------------------------------------------------------------------
-- Hasta ahora los límites de register_participant_cards eran constantes en la
-- función; cambiarlos exigía CREATE OR REPLACE desde el SQL Editor.
--
-- registration_limits guarda la config activa (fila única id=1) y la función
-- la lee en cada llamada. El admin la cambia desde
-- Configuración → Límites de Registro con dos presets:
--   'normal' : 10 envíos/min · 40 cartones/día por IP · 30 por teléfono
--   'evento' : 500 envíos/min · 15,000 cartones/día por IP · 30 por teléfono
--              (el venue puede compartir UNA IP pública: WiFi local o CGNAT;
--               los topes normales bloquearían a asistentes reales)
--
-- Ejecutar en Supabase SQL Editor o vía `supabase db push`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla de configuración (fila única)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_limits (
  id                   smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mode                 text NOT NULL DEFAULT 'normal'
                       CHECK (mode IN ('normal', 'evento')),
  max_attempts_minute  integer NOT NULL DEFAULT 10   CHECK (max_attempts_minute > 0),
  max_cards_day_ip     integer NOT NULL DEFAULT 40   CHECK (max_cards_day_ip > 0),
  max_cards_phone      integer NOT NULL DEFAULT 30   CHECK (max_cards_phone > 0),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  updated_by           uuid
);

INSERT INTO public.registration_limits (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS: lectura para autenticados (el admin la muestra); escritura solo
-- admin global o admin_empresa/ventas (mismo patrón que wheel_configs).
ALTER TABLE public.registration_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registration_limits_read"
ON public.registration_limits FOR SELECT TO authenticated
USING (true);

CREATE POLICY "registration_limits_write"
ON public.registration_limits FOR ALL TO authenticated
USING (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND r.name = ANY (ARRAY['admin_empresa'])))
WITH CHECK (
  is_admin_global() OR EXISTS (
    SELECT 1 FROM user_companies uc
    JOIN roles r ON r.role_id = uc.role_id
    WHERE uc.user_id = (SELECT auth.uid())
      AND r.name = ANY (ARRAY['admin_empresa'])));

GRANT SELECT, UPDATE ON public.registration_limits TO authenticated;

COMMENT ON TABLE public.registration_limits IS
  'Config anti-abuso del registro público /registro (fila única id=1). mode normal=10/40/30, evento=500/15000/30. La lee register_participant_cards en cada llamada.';

-- ----------------------------------------------------------------------------
-- 2. RPC con límites leídos de registration_limits (fallback a valores normal)
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
  -- Límites vigentes: se leen de registration_limits; si la fila no existe
  -- (config no aplicada) se usan los valores del modo 'normal'.
  v_max_attempts_minute integer;
  v_max_cards_day_ip    integer;
  v_max_cards_phone     integer;
BEGIN
  SELECT l.max_attempts_minute, l.max_cards_day_ip, l.max_cards_phone
    INTO v_max_attempts_minute, v_max_cards_day_ip, v_max_cards_phone
    FROM public.registration_limits l WHERE l.id = 1;

  v_max_attempts_minute := COALESCE(v_max_attempts_minute, 10);
  v_max_cards_day_ip    := COALESCE(v_max_cards_day_ip, 40);
  v_max_cards_phone     := COALESCE(v_max_cards_phone, 30);

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

  IF v_recent > v_max_attempts_minute THEN
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

  IF v_phone_cards + cardinality(v_cards) > v_max_cards_phone THEN
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

  IF v_today_cards + cardinality(v_cards) > v_max_cards_day_ip THEN
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
  'Registro atómico todo-o-nada de cartones del asistente; valida existencia, estado Vendido/Donado y duplicados; aplica límites anti-abuso por IP (ráfaga y tope diario) y por teléfono leídos de registration_limits; retorna resultado por cartón y folio de confirmación.';
