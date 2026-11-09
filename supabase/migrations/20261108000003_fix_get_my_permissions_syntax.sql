-- ============================================================
-- fix(security): corregir error de sintaxis en get_my_permissions()
-- BUG-SEC-015: La consulta externa usaba so.code en lugar de t.code
-- sobre el subquery 't', provocando el error 42P01 en PostgreSQL:
-- "missing FROM-clause entry for table \"so\""
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
DECLARE
  v_uid      uuid        := auth.uid();
  v_now      timestamptz := now();
  v_ver      integer;
  v_role_ids uuid[];
  v_sa       boolean;
  v_ma       jsonb;
  v_opts     jsonb;
  v_res      jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  -- Versión vigente de permisos
  SELECT COALESCE(version, 1) INTO v_ver
  FROM public.sec_authz_version WHERE user_id = v_uid;

  -- Roles activos del usuario (con vigencia temporal completa)
  SELECT array_agg(sur.role_id) INTO v_role_ids
  FROM public.sec_user_roles sur
  JOIN public.sec_roles sr ON sr.id = sur.role_id AND sr.is_active = true
  WHERE sur.user_id  = v_uid
    AND sur.is_active = true
    AND (sur.valid_from IS NULL OR sur.valid_from <= v_now)
    AND (sur.valid_to   IS NULL OR sur.valid_to   >= v_now);

  -- SuperAdmin: consulta INDEPENDIENTE de sec_permissions
  SELECT COALESCE(bool_or(sr.is_super_admin), false) INTO v_sa
  FROM public.sec_roles sr
  WHERE sr.id = ANY(COALESCE(v_role_ids, ARRAY[]::uuid[]));

  IF v_sa THEN
    RETURN jsonb_build_object(
      'v',  COALESCE(v_ver, 1),
      'sa', true,
      'ma', '[]'::jsonb,
      'o',  '{}'::jsonb,
      'r',  '{}'::jsonb
    );
  END IF;

  IF v_role_ids IS NULL OR array_length(v_role_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'v', COALESCE(v_ver, 1), 'sa', false,
      'ma', '[]'::jsonb, 'o', '{}'::jsonb, 'r', '{}'::jsonb
    );
  END IF;

  -- Módulos que el usuario administra (tiene al menos READ en alguna opción)
  SELECT jsonb_agg(DISTINCT sm.code) INTO v_ma
  FROM public.sec_permissions sp
  JOIN public.sec_options so ON so.id = sp.option_id
  JOIN public.sec_modules sm ON sm.id = so.module_id
  WHERE sp.role_id = ANY(v_role_ids)
    AND sp.resource_id IS NULL
    AND (sp.actions_mask & 1) = 1;

  -- Mapa opción → máscara acumulada (OR de todos los roles)
  -- BUG-SEC-015: usar t.code en lugar de so.code (t es el alias del subquery)
  SELECT jsonb_object_agg(t.code, t.agg_mask) INTO v_opts
  FROM (
    SELECT so.code, bit_or(sp.actions_mask) AS agg_mask
    FROM public.sec_permissions sp
    JOIN public.sec_options so ON so.id = sp.option_id
    WHERE sp.role_id = ANY(v_role_ids) AND sp.resource_id IS NULL
    GROUP BY so.code
  ) t;

  -- Mapa recurso → máscara acumulada ("OPCION_CODE:table_name")
  -- BUG-SEC-015: usar t.key y t.agg_mask del subquery t
  SELECT jsonb_object_agg(t.key, t.agg_mask) INTO v_res
  FROM (
    SELECT so.code || ':' || sr.table_name AS key,
           bit_or(sp.actions_mask) AS agg_mask
    FROM public.sec_permissions sp
    JOIN public.sec_options   so ON so.id = sp.option_id
    JOIN public.sec_resources sr ON sr.id = sp.resource_id
    WHERE sp.role_id = ANY(v_role_ids) AND sp.resource_id IS NOT NULL
    GROUP BY so.code, sr.table_name
  ) t;

  RETURN jsonb_build_object(
    'v',  COALESCE(v_ver, 1),
    'sa', false,
    'ma', COALESCE(v_ma, '[]'::jsonb),
    'o',  COALESCE(v_opts, '{}'::jsonb),
    'r',  COALESCE(v_res, '{}'::jsonb)
  );
END;
$function$;
