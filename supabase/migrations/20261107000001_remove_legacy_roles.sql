-- ============================================================
-- Eliminar sistema de roles legado.
-- Reemplazado por las tablas sec_* (sec_roles, sec_user_roles).
--
-- Árbol de dependencias resuelto:
--   roles ← users.role_id, user_companies.role_id
--   is_global_role() ← users.role_id + roles.name
--   is_admin_global() ← is_global_role('admin')
--   RLS policies ← is_admin_global() + JOIN roles ON role_id
--   is_superadmin() ← users.role_id + roles.level
--   roles_admin_manage_policy ← is_superadmin()
--   trg_user_companies_sync_role ← user_companies.role_id
-- ============================================================

-- ── PASO 1: Trigger ──────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_user_companies_sync_role ON public.user_companies;

-- ── PASO 2: Políticas de la tabla roles ──────────────────────
DROP POLICY IF EXISTS "roles_select_policy"       ON public.roles;
DROP POLICY IF EXISTS "roles_admin_manage_policy" ON public.roles;

-- ── PASO 3: Función is_superadmin() ──────────────────────────
DROP FUNCTION IF EXISTS public.is_superadmin();

-- ── PASO 4: Todas las políticas que referencian role_id ──────
DROP POLICY IF EXISTS "cards_write_delete"           ON public.cards;
DROP POLICY IF EXISTS "cards_write_insert"           ON public.cards;
DROP POLICY IF EXISTS "cards_write_update"           ON public.cards;
DROP POLICY IF EXISTS "update_companies_admin"       ON public.companies;
DROP POLICY IF EXISTS "customer_phone_number_delete" ON public.customer_phone_number;
DROP POLICY IF EXISTS "customer_phone_number_insert" ON public.customer_phone_number;
DROP POLICY IF EXISTS "customer_phone_number_update" ON public.customer_phone_number;
DROP POLICY IF EXISTS "write_events_admins_delete"   ON public.events;
DROP POLICY IF EXISTS "write_events_admins_insert"   ON public.events;
DROP POLICY IF EXISTS "write_events_admins_update"   ON public.events;
DROP POLICY IF EXISTS "invoices_write_delete"        ON public.invoices;
DROP POLICY IF EXISTS "invoices_write_insert"        ON public.invoices;
DROP POLICY IF EXISTS "invoices_write_update"        ON public.invoices;
DROP POLICY IF EXISTS "registration_limits_write"    ON public.registration_limits;
DROP POLICY IF EXISTS "students_cards_delete"        ON public.students_cards;
DROP POLICY IF EXISTS "students_cards_insert"        ON public.students_cards;
DROP POLICY IF EXISTS "students_cards_update"        ON public.students_cards;
DROP POLICY IF EXISTS "wheel_configs_write"          ON public.wheel_configs;
DROP POLICY IF EXISTS "wheel_items_write"            ON public.wheel_items;
DROP POLICY IF EXISTS "wheel_part_write"             ON public.wheel_participating_cards;
DROP POLICY IF EXISTS "wheel_spins_write"            ON public.wheel_spins;
DROP POLICY IF EXISTS "wheels_presents_write"        ON public.wheels_presents_cards;

-- ── PASO 5: Reescribir is_global_role() sobre sec_* ──────────
-- La función es SECURITY DEFINER para evitar recursión en RLS.
-- • 'admin'  → SuperAdmin (sec_roles.is_super_admin = true)
-- • cualquier otro nombre (ej. 'reader') → tiene algún rol activo
CREATE OR REPLACE FUNCTION public.is_global_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $$
  SELECT CASE p_role
    WHEN 'admin' THEN
      EXISTS (
        SELECT 1 FROM public.sec_user_roles sur
        JOIN public.sec_roles sr ON sr.id = sur.role_id
        WHERE sur.user_id = (SELECT auth.uid())
          AND sr.is_super_admin = true
          AND sur.is_active = true
      )
    ELSE
      EXISTS (
        SELECT 1 FROM public.sec_user_roles sur
        WHERE sur.user_id = (SELECT auth.uid())
          AND sur.is_active = true
      )
  END;
$$;
-- is_admin_global() ya llama is_global_role('admin') → automáticamente actualizada.

-- ── PASO 6: Eliminar columnas legadas ────────────────────────
ALTER TABLE public.user_companies DROP COLUMN IF EXISTS role_id;
ALTER TABLE public.users          DROP COLUMN IF EXISTS role_id;

-- ── PASO 7: Eliminar tabla roles ─────────────────────────────
DROP TABLE IF EXISTS public.roles CASCADE;

-- ── PASO 8: Recrear políticas RLS sin role_id ────────────────
-- Nueva semántica:
--   is_admin_global() (SuperAdmin) O miembro de la empresa.
-- El control fino (qué operaciones puede hacer cada rol) lo
-- aplica la capa de aplicación vía checkAdmin()/withRole()/sec_*.

-- cards
CREATE POLICY "cards_write_delete" ON public.cards FOR DELETE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = cards.company_id
  ));
CREATE POLICY "cards_write_insert" ON public.cards FOR INSERT
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = cards.company_id
  ));
CREATE POLICY "cards_write_update" ON public.cards FOR UPDATE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = cards.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = cards.company_id
  ));

-- companies (solo SuperAdmin)
CREATE POLICY "update_companies_admin" ON public.companies FOR UPDATE
  USING (is_admin_global());

-- customer_phone_number
CREATE POLICY "customer_phone_number_delete" ON public.customer_phone_number FOR DELETE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = customer_phone_number.company_id
  ));
CREATE POLICY "customer_phone_number_insert" ON public.customer_phone_number FOR INSERT
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = customer_phone_number.company_id
  ));
CREATE POLICY "customer_phone_number_update" ON public.customer_phone_number FOR UPDATE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = customer_phone_number.company_id
  ));

-- events
CREATE POLICY "write_events_admins_delete" ON public.events FOR DELETE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = events.company_id
  ));
CREATE POLICY "write_events_admins_insert" ON public.events FOR INSERT
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = events.company_id
  ));
CREATE POLICY "write_events_admins_update" ON public.events FOR UPDATE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = events.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = events.company_id
  ));

-- invoices
CREATE POLICY "invoices_write_delete" ON public.invoices FOR DELETE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = invoices.company_id
  ));
CREATE POLICY "invoices_write_insert" ON public.invoices FOR INSERT
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = invoices.company_id
  ));
CREATE POLICY "invoices_write_update" ON public.invoices FOR UPDATE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = invoices.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = invoices.company_id
  ));

-- registration_limits (sin company_id propio: cualquier miembro)
CREATE POLICY "registration_limits_write" ON public.registration_limits
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies WHERE user_id = auth.uid()
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies WHERE user_id = auth.uid()
  ));

-- students_cards
CREATE POLICY "students_cards_delete" ON public.students_cards FOR DELETE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = students_cards.company_id
  ));
CREATE POLICY "students_cards_insert" ON public.students_cards FOR INSERT
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = students_cards.company_id
  ));
CREATE POLICY "students_cards_update" ON public.students_cards FOR UPDATE
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = students_cards.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = students_cards.company_id
  ));

-- wheel_configs
CREATE POLICY "wheel_configs_write" ON public.wheel_configs FOR ALL TO authenticated
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_configs.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_configs.company_id
  ));

-- wheel_items
CREATE POLICY "wheel_items_write" ON public.wheel_items FOR ALL TO authenticated
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_items.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_items.company_id
  ));

-- wheel_participating_cards
CREATE POLICY "wheel_part_write" ON public.wheel_participating_cards FOR ALL TO authenticated
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_participating_cards.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_participating_cards.company_id
  ));

-- wheel_spins
CREATE POLICY "wheel_spins_write" ON public.wheel_spins FOR INSERT TO authenticated
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheel_spins.company_id
  ));

-- wheels_presents_cards
CREATE POLICY "wheels_presents_write" ON public.wheels_presents_cards FOR ALL TO authenticated
  USING (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheels_presents_cards.company_id
  ))
  WITH CHECK (is_admin_global() OR EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = wheels_presents_cards.company_id
  ));
