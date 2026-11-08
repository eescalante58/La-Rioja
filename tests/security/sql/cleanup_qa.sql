-- ============================================================
-- QA Módulo de Seguridad — Script de Limpieza
-- Archivo:  tests/security/sql/cleanup_qa.sql
-- Ejecutar al finalizar el QA para borrar todos los datos QA_
-- IMPORTANTE: Eliminar auth.users vía Admin API (Node.js).
-- ============================================================

BEGIN;

-- 1. Revocar asignaciones de roles QA
DELETE FROM public.sec_user_roles
WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@qa.larioja.test%'
);

-- 2. Quitar membresías de empresa de usuarios QA
DELETE FROM public.user_companies
WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@qa.larioja.test%'
);

-- 3. Borrar versiones de autorización de usuarios QA
DELETE FROM public.sec_authz_version
WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@qa.larioja.test%'
);

-- 4. Borrar actividad registrada de usuarios QA
DELETE FROM public.user_activity_log
WHERE user_id IN (
  SELECT id FROM public.users WHERE email LIKE '%@qa.larioja.test%'
);

-- 5. Borrar permisos de roles QA
DELETE FROM public.sec_permissions
WHERE role_id IN (
  SELECT id FROM public.sec_roles WHERE code LIKE 'QA_%'
);

-- 6. Borrar roles QA
DELETE FROM public.sec_roles WHERE code LIKE 'QA_%';

-- 7. Borrar perfil público de usuarios QA (auth.users los borrará el script Node.js)
DELETE FROM public.users WHERE email LIKE '%@qa.larioja.test%';

-- 8. Borrar empresa temporal QA si se creó
DELETE FROM public.user_companies
WHERE company_id IN (SELECT company_id FROM public.companies WHERE company_name = 'QA_EMPRESA_TEMP');
DELETE FROM public.companies WHERE company_name = 'QA_EMPRESA_TEMP';

COMMIT;

-- ── VERIFICACIÓN POST-LIMPIEZA ───────────────────────────────────────────
SELECT 'usuarios QA residuales' AS check, count(*) FROM public.users WHERE email LIKE '%@qa.larioja.test%'
UNION ALL
SELECT 'roles QA residuales',    count(*) FROM public.sec_roles WHERE code LIKE 'QA_%'
UNION ALL
SELECT 'permisos QA residuales', count(*) FROM public.sec_permissions
  WHERE role_id IN (SELECT id FROM public.sec_roles WHERE code LIKE 'QA_%')
UNION ALL
SELECT 'membresías QA residuales', count(*) FROM public.user_companies
  WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE '%@qa.larioja.test%')
UNION ALL
SELECT 'empresa QA_EMPRESA_TEMP', count(*) FROM public.companies WHERE company_name = 'QA_EMPRESA_TEMP';
-- Resultado esperado: todas en 0
