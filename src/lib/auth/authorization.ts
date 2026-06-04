import { createClient } from "@/lib/supabase/server";

/**
 * Checks if a user is authenticated and has a minimum role level.
 * @param minLevel Minimum level required (SuperAdmin: 100, Admin: 80, Editor: 60, Operator: 40)
 * @returns {Promise<{user: any, level: number, error?: string}>}
 */
export async function requireRoleLevel(minLevel: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, level: 0, error: "No autenticado" };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("roles:role_id (level)")
    .eq("id", user.id)
    .single();

  const level = (userData?.roles as any)?.level || 0;

  if (level < minLevel) {
    return { user, level, error: "Permisos insuficientes" };
  }

  return { user, level };
}

/**
 * Validates if the user has access to a specific company.
 * @param companyId The ID of the company to check access for.
 * @returns {Promise<{authorized: boolean, role?: string, error?: string}>}
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
