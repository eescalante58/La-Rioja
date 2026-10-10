import type { User } from "@supabase/supabase-js";
import { requireRoleLevel, requireCompanyAccess } from "./authorization";

/** Contexto que `withRole` agrega como último argumento de la acción. */
export interface RoleContext {
  user: User;
  level: number;
}

/** Contexto que `withCompanyAccess` agrega como último argumento de la acción. */
export interface CompanyContext {
  role?: string;
}

/** Respuesta de un guard que rechaza la llamada. */
export interface GuardError {
  success: false;
  error: string;
}

/** Cualquier función que pueda protegerse con un guard. */
type GuardableAction = (...args: never[]) => unknown;

/**
 * Parámetros públicos de una acción protegida con `withRole`: se quita el
 * último parámetro solo si es el contexto (acepta un `RoleContext`); las
 * acciones que no declaran contexto conservan todos sus parámetros.
 */
type WithoutRoleContext<F extends GuardableAction> =
  Parameters<F> extends [...infer Head, infer Last]
    ? RoleContext extends Last
      ? Head
      : Parameters<F>
    : Parameters<F>;

/** Resultado de una acción protegida: el de la acción o el error del guard. */
type GuardedResult<F extends GuardableAction> = Promise<Awaited<ReturnType<F>> | GuardError>;

/**
 * Invoca la acción con los argumentos del cliente más el contexto del
 * guard. Los argumentos ya llegan con el tipo público de la acción; el
 * contexto se agrega en la última posición.
 */
function invoke<F extends GuardableAction>(
  action: F,
  args: unknown[],
): Promise<Awaited<ReturnType<F>>> {
  // Reflect.apply: los parámetros de F no se pueden expresar sobre unknown[].
  return Promise.resolve(Reflect.apply(action, undefined, args)) as Promise<Awaited<ReturnType<F>>>;
}

/**
 * Higher-order function to protect server actions by role level.
 * @param minLevel Minimum role level required.
 * @param action The server action function to wrap. Receives `RoleContext`
 *   (`{ user, level }`) as its last argument.
 */
export function withRole<F extends GuardableAction>(
  minLevel: number,
  action: F,
): (...args: WithoutRoleContext<F>) => GuardedResult<F> {
  return async (...args: WithoutRoleContext<F>): GuardedResult<F> => {
    const { user, level, error } = await requireRoleLevel(minLevel);
    if (error || !user) {
      return { success: false, error: error ?? "No autenticado" };
    }
    // Pass user and level as a context object in the last position if needed
    const context: RoleContext = { user, level };
    return invoke(action, [...args, context]);
  };
}

/**
 * Normaliza el identificador de empresa recibido por la acción: el valor
 * directo, el campo `company_id` de un FormData o de un objeto.
 * @param value Argumento de la acción en la posición indicada.
 * @returns Identificador de empresa para `requireCompanyAccess`.
 */
function companyIdFrom(value: unknown): number | string {
  let companyId: unknown = value;
  // If the argument is an object and contains company_id, use that
  // Or if it's FormData, try to get company_id from it
  if (companyId instanceof FormData) {
    companyId = companyId.get("company_id");
  } else if (typeof companyId === "object" && companyId !== null && "company_id" in companyId) {
    companyId = companyId.company_id;
  }
  return typeof companyId === "number" || typeof companyId === "string"
    ? companyId
    : String(companyId);
}

/**
 * Higher-order function to protect server actions by company access.
 * @param action The server action function to wrap.
 * @param companyIdIndex The index of the companyId argument in the action's arguments.
 */
export function withCompanyAccess<F extends GuardableAction>(
  action: F,
  companyIdIndex: number = 0,
): (...args: Parameters<F>) => GuardedResult<F> {
  return async (...args: Parameters<F>): GuardedResult<F> => {
    const companyId = companyIdFrom(args[companyIdIndex]);

    const { authorized, role, error } = await requireCompanyAccess(companyId);
    if (!authorized) {
      return { success: false, error: error || "Acceso denegado a la empresa" };
    }
    // Pass role as context
    const context: CompanyContext = { role };
    return invoke(action, [...args, context]);
  };
}
