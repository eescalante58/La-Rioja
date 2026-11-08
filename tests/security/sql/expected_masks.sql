-- ============================================================
-- QA Módulo de Seguridad — Máscaras Esperadas por Usuario
-- Archivo:  tests/security/sql/expected_masks.sql
-- Calcula el OR bit a bit de todas las asignaciones vigentes
-- y activas para cada usuario QA.
-- ============================================================

WITH active_assignments AS (
  SELECT
    sur.user_id,
    sp.option_id,
    sp.resource_id,
    sp.actions_mask
  FROM public.sec_user_roles sur
  JOIN public.sec_roles sr       ON sr.id = sur.role_id
  JOIN public.sec_permissions sp ON sp.role_id = sur.role_id
  WHERE sur.is_active = true
    AND sr.is_active  = true
    AND (sur.valid_from IS NULL OR sur.valid_from <= now())
    AND (sur.valid_to   IS NULL OR sur.valid_to   >= now())
),
aggregated AS (
  SELECT
    u.email,
    aa.option_id,
    so.code          AS option_code,
    aa.resource_id,
    bit_or(aa.actions_mask::bit(8))::integer AS expected_mask
  FROM public.users u
  JOIN active_assignments aa ON aa.user_id = u.id
  JOIN public.sec_options  so ON so.id = aa.option_id
  WHERE u.email LIKE '%@qa.larioja.test%'
  GROUP BY u.email, aa.option_id, so.code, aa.resource_id
)
SELECT
  email,
  option_code,
  resource_id,
  expected_mask,
  -- Decodificar bits para facilitar la lectura
  CASE WHEN expected_mask & 1   > 0 THEN 'R' ELSE '-' END ||
  CASE WHEN expected_mask & 2   > 0 THEN 'W' ELSE '-' END ||
  CASE WHEN expected_mask & 4   > 0 THEN 'U' ELSE '-' END ||
  CASE WHEN expected_mask & 8   > 0 THEN 'D' ELSE '-' END ||
  CASE WHEN expected_mask & 16  > 0 THEN 'P' ELSE '-' END ||
  CASE WHEN expected_mask & 32  > 0 THEN 'X' ELSE '-' END ||
  CASE WHEN expected_mask & 64  > 0 THEN 'I' ELSE '-' END ||
  CASE WHEN expected_mask & 128 > 0 THEN 'E' ELSE '-' END AS bits_desc
FROM aggregated
ORDER BY email, option_code, resource_id;

-- ── Usuarios QA sin ningún permiso activo (esperado: qa_norole, qa_expired, qa_future, qa_inactive_*) ──
SELECT u.email, 'SIN PERMISOS ACTIVOS' AS estado
FROM public.users u
LEFT JOIN (
  SELECT DISTINCT sur.user_id
  FROM public.sec_user_roles sur
  JOIN public.sec_roles sr ON sr.id = sur.role_id
  WHERE sur.is_active = true AND sr.is_active = true
    AND (sur.valid_from IS NULL OR sur.valid_from <= now())
    AND (sur.valid_to   IS NULL OR sur.valid_to   >= now())
) active ON active.user_id = u.id
WHERE u.email LIKE '%@qa.larioja.test%'
  AND active.user_id IS NULL
ORDER BY u.email;
