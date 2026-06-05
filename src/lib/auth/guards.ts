import { requireRoleLevel, requireCompanyAccess } from "./authorization";

/**
 * Higher-order function to protect server actions by role level.
 * @param minLevel Minimum role level required.
 * @param action The server action function to wrap.
 */
export function withRole(minLevel: number, action: Function) {
  return async (...args: any[]) => {
    const { user, level, error } = await requireRoleLevel(minLevel);
    if (error) {
      return { success: false, error };
    }
    // Pass user and level as a context object in the last position if needed
    return action(...args, { user, level });
  };
}

/**
 * Higher-order function to protect server actions by company access.
 * @param action The server action function to wrap.
 * @param companyIdIndex The index of the companyId argument in the action's arguments.
 */
export function withCompanyAccess(action: Function, companyIdIndex: number = 0) {
  return async (...args: any[]) => {
    let companyId = args[companyIdIndex];
    
    // If the argument is an object and contains company_id, use that
    // Or if it's FormData, try to get company_id from it
    if (companyId instanceof FormData) {
      companyId = companyId.get("company_id");
    } else if (typeof companyId === 'object' && companyId !== null && 'company_id' in companyId) {
      companyId = (companyId as any).company_id;
    }

    const { authorized, role, error } = await requireCompanyAccess(companyId);
    if (!authorized) {
      return { success: false, error: error || "Acceso denegado a la empresa" };
    }
    // Pass role as context
    return action(...args, { role });
  };
}
