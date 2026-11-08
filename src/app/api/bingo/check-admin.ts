import { requireRoleLevel, requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * Guard compartido de los Route Handlers /api/bingo/*.
 *
 * Requiere nivel de rol >= minLevel (8 = cualquier rol activo por defecto;
 * 10 = solo SuperAdmin) y membresía en la empresa indicada.
 * El adaptador solo reconoce 10, 8 y 0 — no existe nivel 4 ni 6.
 */
export async function checkAdmin(companyId: number, minLevel = 8) {
  const { user, error: roleError } = await requireRoleLevel(minLevel);
  if (roleError) {
    return { status: roleError === "No autenticado" ? 401 : 403, error: roleError };
  }

  const { authorized, error } = await requireCompanyAccess(companyId);
  if (!authorized) {
    return { status: 403, error: error || "Acceso denegado" };
  }
  return { user };
}
