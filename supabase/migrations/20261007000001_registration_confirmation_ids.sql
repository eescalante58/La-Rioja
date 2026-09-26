-- ============================================================================
-- Registro público: el RPC devuelve los ids de las filas insertadas
-- ----------------------------------------------------------------------------
-- El asistente recibe como código de confirmación el id de su registro en
-- wheels_presents_cards (ej. "Código de registro: 1042"). El staff puede
-- verificar el cartón contra ese folio el día del evento.
-- ============================================================================

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
    WITH ins AS (
      INSERT INTO public.wheels_presents_cards
        (wheel_id, company_id, event_id, mode, wheel_name,
         card_number, player_name, player_phone_number)
      SELECT v_cfg.id, v_cfg.company_id, v_cfg.event_id, 'Participantes',
             v_cfg.wheel_name, n,
             btrim(p_player_name), btrim(p_player_phone)
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
  'Registro atómico todo-o-nada de cartones del asistente; valida existencia, estado Vendido/Donado y duplicados; retorna resultado por cartón y los ids de registro como folio de confirmación.';
