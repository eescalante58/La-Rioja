import { requireRoleLevel, requireCompanyAccess } from "@/lib/auth/authorization";

/**
 * Guard compartido de los Route Handlers /api/bingo/*.
 *
 * Requiere nivel de rol >= minLevel (4 operador por defecto; 6 editor
 * para envíos automáticos de WhatsApp) y membresía en la empresa
 * indicada. Devuelve el usuario autenticado o un descriptor de error
 * listo para responder como JSON.
 */
export async function checkAdmin(companyId: number, minLevel = 4) {
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
