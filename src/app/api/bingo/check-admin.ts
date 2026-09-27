import { requireRoleLevel, requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * Guard compartido de los Route Handlers /api/bingo/*.
 *
 * Requiere nivel de rol >= 4 (operador) y membresía en la empresa
 * indicada. Devuelve el usuario autenticado o un descriptor de error
 * listo para responder como JSON.
 */
export async function checkAdmin(companyId: number) {
  const { user, error: roleError } = await requireRoleLevel(4);
  if (roleError) {
    return { status: roleError === "No autenticado" ? 401 : 403, error: roleError };
  }

  const { authorized, error } = await requireCompanyAccess(companyId);
  if (!authorized) {
    return { status: 403, error: error || "Acceso denegado" };
  }
  return { user };
}
