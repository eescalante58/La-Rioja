import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Verifica si el usuario autenticado tiene un nivel de privilegio suficiente.
 * El nivel se deriva del módulo de seguridad (sec_user_roles + sec_roles):
 *   - 10 → el usuario tiene al menos un rol con is_super_admin = true
 *   - 8  → el usuario tiene al menos un rol activo (no vencido) sin is_super_admin
 *   - 0  → sin roles activos
 *
 * @param minLevel Nivel mínimo requerido (SuperAdmin=10, Admin/cualquier rol=8, solo autenticado=0)
 */
export async function requireRoleLevel(minLevel: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, level: 0, error: "No autenticado" };
  }

  if (minLevel <= 0) {
    return { user, level: 1 };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: assignments } = await admin
    .from("sec_user_roles")
    .select("sec_roles(is_super_admin)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .or(`valid_to.is.null,valid_to.gte.${now}`);

  const rows = (assignments ?? []) as Array<{
    sec_roles: { is_super_admin: boolean } | Array<{ is_super_admin: boolean }> | null;
  }>;

  const isSuperAdmin = rows.some((a) => {
    const r = a.sec_roles;
    if (!r) return false;
    if (Array.isArray(r)) return r.some((x) => x.is_super_admin);
    return r.is_super_admin;
  });

  const hasAnyRole = rows.length > 0;

  // Mapeo: super_admin → 10, cualquier rol activo → 8, sin roles → 0
  const level = isSuperAdmin ? 10 : hasAnyRole ? 8 : 0;

  if (level < minLevel) {
    return {
      user,
      level,
      error: `Permisos insuficientes: tu rol actual (nivel ${level}) requiere nivel ${minLevel} o superior. Por favor, solicita al Administrador que asigne los permisos necesarios.`,
    };
  }

  return { user, level };
}

/**
 * Valida si el usuario autenticado tiene membresía en la empresa indicada.
 * No depende del sistema de roles; solo verifica la fila en user_companies.
 */
export async function requireCompanyAccess(companyId: number | string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "No autenticado" };
  }

  const { data: membership, error } = await supabase
    .from("user_companies")
    .select("role")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .single();

  if (error || !membership) {
    return { authorized: false, error: "No tienes acceso a esta empresa" };
  }

  return { authorized: true, role: membership.role };
}
