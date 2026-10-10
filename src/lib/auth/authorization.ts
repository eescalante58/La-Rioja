import { createClient, createAdminClient } from "@/lib/supabase/server";
import { singleRelation } from "@/lib/utils";
import type { Tables } from "@/types/database";

type RoleLevel = Pick<Tables<"roles">, "level">;

/**
 * Fila de `users` con la relación `roles:role_id (level)`. En ejecución
 * la relación many-to-one llega como objeto; el cliente sin tipos de
 * esquema la infiere como arreglo, por eso se aceptan ambas formas.
 */
export interface UserRoleLevelRow {
  roles: RoleLevel | RoleLevel[] | null;
}

/**
 * Nivel de rol de una fila `users` consultada con `roles:role_id (level)`.
 * @param row Fila consultada (o null si no existe).
 * @returns Nivel del rol, o 0 si no tiene.
 */
export function roleLevelOf(row: UserRoleLevelRow | null | undefined): number {
  return singleRelation(row?.roles)?.level || 0;
}

/**
 * Checks if a user is authenticated and has a minimum role level.
 * @param minLevel Minimum level required (SuperAdmin: 10, Admin: 8, Editor: 6, Operator: 4)
 * @returns {Promise<{user: User | null, level: number, error?: string}>}
 */
export async function requireRoleLevel(minLevel: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, level: 0, error: "No autenticado" };
  }

  // Use Admin client to fetch role level to avoid RLS issues during auth check
  const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("roles:role_id (level)")
    .eq("id", user.id)
    .single();

  const level = roleLevelOf(userData);

  if (level < minLevel) {
    return {
      user,
      level,
      error: `Permisos insuficientes (Nivel: ${level}, Requerido: ${minLevel})`,
    };
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
