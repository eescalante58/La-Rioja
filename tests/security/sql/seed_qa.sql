-- ============================================================
-- QA Módulo de Seguridad — Script de Seed
-- Archivo:  tests/security/sql/seed_qa.sql
-- Proyecto: La Rioja (producción: wfkqsifhxnarmxrvbgiu)
-- IMPORTANTE: Ejecutar SOLO cuando se autorice QA en producción.
--             La creación de auth.users debe hacerse vía Node.js /
--             Supabase Admin API (ver seed_qa_users.mjs).
--             Este script asume que los UUIDs de los usuarios QA
--             ya fueron creados y se pegan en las variables de arriba.
-- ============================================================

-- ── VARIABLES — reemplazar con los UUIDs reales tras crear auth.users ────
DO $$
DECLARE
  v_company_prueba   integer := 4;  -- "La Rioja Prueba" (company_id=4)

  -- Sustituir con UUIDs reales devueltos por el script Node.js seed_qa_users.mjs
  v_qa_sa            uuid := NULL; -- qa_sa@qa.larioja.test
  v_qa_admin_users   uuid := NULL; -- qa_admin_users@qa.larioja.test
  v_qa_users_read    uuid := NULL; -- qa_users_read@qa.larioja.test
  v_qa_users_write   uuid := NULL; -- qa_users_write@qa.larioja.test
  v_qa_bingo         uuid := NULL; -- qa_bingo@qa.larioja.test
  v_qa_multi         uuid := NULL; -- qa_multi@qa.larioja.test
  v_qa_norole        uuid := NULL; -- qa_norole@qa.larioja.test
  v_qa_expired       uuid := NULL; -- qa_expired@qa.larioja.test
  v_qa_future        uuid := NULL; -- qa_future@qa.larioja.test
  v_qa_inactive_ass  uuid := NULL; -- qa_inactive_assign@qa.larioja.test
  v_qa_inactive_role uuid := NULL; -- qa_inactive_role@qa.larioja.test
  v_qa_nocompany     uuid := NULL; -- qa_nocompany@qa.larioja.test

  -- IDs de roles creados
  v_role_qa_super       uuid;
  v_role_qa_users_full  uuid;
  v_role_qa_users_read  uuid;
  v_role_qa_bingo_ops   uuid;
  v_role_qa_multi_a     uuid;
  v_role_qa_multi_b     uuid;
  v_role_qa_inactive    uuid;

  -- IDs de opciones (leer de sec_options)
  v_opt_cfg_users_roles uuid;
  v_opt_bingo_events    uuid;
BEGIN

  -- ── VALIDAR PRECONDICIÓN ─────────────────────────────────────────────────
  IF v_qa_sa IS NULL THEN
    RAISE EXCEPTION 'Debes asignar los UUIDs de los usuarios QA antes de ejecutar este script.';
  END IF;

  -- ── OBTENER IDs DE OPCIONES ──────────────────────────────────────────────
  SELECT id INTO v_opt_cfg_users_roles FROM public.sec_options WHERE code = 'CFG_USERS_ROLES';
  SELECT id INTO v_opt_bingo_events    FROM public.sec_options WHERE code = 'BINGO_EVENTS';

  -- ── CREAR ROLES QA ───────────────────────────────────────────────────────

  -- QA_SUPER: SuperAdmin de prueba
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_SUPER', 'QA SuperAdmin', 'Rol QA para pruebas de SuperAdmin', true, false, true)
  RETURNING id INTO v_role_qa_super;

  -- QA_USERS_FULL: CFG_USERS_ROLES=255 sin SA
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_USERS_FULL', 'QA Users Full', 'Rol QA con todos los permisos en CFG_USERS_ROLES (escalada)', false, false, true)
  RETURNING id INTO v_role_qa_users_full;

  INSERT INTO public.sec_permissions (role_id, option_id, resource_id, actions_mask)
  VALUES (v_role_qa_users_full, v_opt_cfg_users_roles, NULL, 255);

  -- QA_USERS_READ: CFG_USERS_ROLES=1 (solo lectura)
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_USERS_READ', 'QA Users Read', 'Rol QA solo lectura en módulo de usuarios', false, false, true)
  RETURNING id INTO v_role_qa_users_read;

  INSERT INTO public.sec_permissions (role_id, option_id, resource_id, actions_mask)
  VALUES (v_role_qa_users_read, v_opt_cfg_users_roles, NULL, 1);  -- READ=1

  -- QA_BINGO_OPS: BINGO_EVENTS=63, sin nada en CONFIG
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_BINGO_OPS', 'QA Bingo Ops', 'Rol QA solo para módulo Bingo (aislamiento)', false, false, true)
  RETURNING id INTO v_role_qa_bingo_ops;

  INSERT INTO public.sec_permissions (role_id, option_id, resource_id, actions_mask)
  VALUES (v_role_qa_bingo_ops, v_opt_bingo_events, NULL, 63);  -- R|W|U|D|P|Ex

  -- QA_MULTI_A: mask 3 (R+W) en CFG_USERS_ROLES
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_MULTI_A', 'QA Multi A', 'Rol QA para prueba de agregación OR (mask=3)', false, false, true)
  RETURNING id INTO v_role_qa_multi_a;

  INSERT INTO public.sec_permissions (role_id, option_id, resource_id, actions_mask)
  VALUES (v_role_qa_multi_a, v_opt_cfg_users_roles, NULL, 3);  -- READ+WRITE

  -- QA_MULTI_B: mask 5 (R+U) en CFG_USERS_ROLES — OR esperado = 7
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_MULTI_B', 'QA Multi B', 'Rol QA para prueba de agregación OR (mask=5)', false, false, true)
  RETURNING id INTO v_role_qa_multi_b;

  INSERT INTO public.sec_permissions (role_id, option_id, resource_id, actions_mask)
  VALUES (v_role_qa_multi_b, v_opt_cfg_users_roles, NULL, 5);  -- READ+UPDATE

  -- QA_INACTIVE_ROLE: role con is_active=false
  INSERT INTO public.sec_roles (code, name, description, is_super_admin, is_system, is_active)
  VALUES ('QA_INACTIVE_ROLE', 'QA Inactive Role', 'Rol QA inactivo para pruebas de vigencia', false, false, false)
  RETURNING id INTO v_role_qa_inactive;

  -- ── ASIGNAR ROLES A USUARIOS QA ──────────────────────────────────────────

  -- qa_sa: QA_SUPER
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_sa, v_role_qa_super, now(), NULL, true);

  -- qa_admin_users: QA_USERS_FULL
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_admin_users, v_role_qa_users_full, now(), NULL, true);

  -- qa_users_read: QA_USERS_READ
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_users_read, v_role_qa_users_read, now(), NULL, true);

  -- qa_users_write: QA_USERS_READ con mask=3 (READ+WRITE) — crear permiso puntual
  -- Usar QA_USERS_READ pero con mask 3 en vez de 1 → crear rol específico
  -- (simplificado: usar QA_MULTI_A que ya tiene mask 3)
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_users_write, v_role_qa_multi_a, now(), NULL, true);

  -- qa_bingo: QA_BINGO_OPS
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_bingo, v_role_qa_bingo_ops, now(), NULL, true);

  -- qa_multi: dos roles QA_MULTI_A (mask 3) + QA_MULTI_B (mask 5) → esperado OR = 7
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_multi, v_role_qa_multi_a, now(), NULL, true);
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_multi, v_role_qa_multi_b, now(), NULL, true);

  -- qa_norole: sin asignación de roles (no INSERT)

  -- qa_expired: asignación con valid_to en el pasado
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_expired, v_role_qa_users_read, now() - interval '30 days', now() - interval '1 day', true);

  -- qa_future: asignación con valid_from en el futuro
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_future, v_role_qa_users_read, now() + interval '1 day', NULL, true);

  -- qa_inactive_assign: is_active=false
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_inactive_ass, v_role_qa_users_read, now(), NULL, false);

  -- qa_inactive_role: asignación activa pero el rol tiene is_active=false
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_inactive_role, v_role_qa_inactive, now(), NULL, true);

  -- qa_nocompany: sin asignar empresa (ver abajo)
  INSERT INTO public.sec_user_roles (user_id, role_id, valid_from, valid_to, is_active)
  VALUES (v_qa_nocompany, v_role_qa_users_read, now(), NULL, true);

  -- ── MEMBRESÍAS EN "LA RIOJA PRUEBA" (company_id=4) ──────────────────────
  -- Todos excepto qa_norole y qa_nocompany
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES
    (v_qa_sa,            v_company_prueba, 'Miembro'),
    (v_qa_admin_users,   v_company_prueba, 'Miembro'),
    (v_qa_users_read,    v_company_prueba, 'Miembro'),
    (v_qa_users_write,   v_company_prueba, 'Miembro'),
    (v_qa_bingo,         v_company_prueba, 'Miembro'),
    (v_qa_multi,         v_company_prueba, 'Miembro'),
    (v_qa_expired,       v_company_prueba, 'Miembro'),
    (v_qa_future,        v_company_prueba, 'Miembro'),
    (v_qa_inactive_ass,  v_company_prueba, 'Miembro'),
    (v_qa_inactive_role, v_company_prueba, 'Miembro');
  -- qa_norole: membresía pero sin rol (para T-09 checkAdmin test)
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (v_qa_norole, v_company_prueba, 'Miembro');
  -- qa_nocompany: sin membresía (intencionalmente omitido)

  RAISE NOTICE 'Seed QA completado. Empresa: %, roles creados, usuarios asignados.', v_company_prueba;
END $$;
