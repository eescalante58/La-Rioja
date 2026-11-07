// lib/security/server.ts — autorización en Server Components, layouts y Server Actions
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canOption,
  canResource,
  type Action,
  type AuthzClaims,
  type PermissionSnapshot,
} from "./types";

// Alias para compatibilidad con el patrón del módulo de seguridad
export const createSupabaseServer = createClient;

// ---- Caché entre peticiones, por usuario + versión de permisos ----------------
// La clave cambia cuando el usuario recibe un JWT con nueva versión (v), así que
// no hace falta invalidar: la entrada vieja simplemente deja de usarse.
const TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 500;
const snapshotCache = new Map<string, { at: number; snap: PermissionSnapshot }>();

function readCache(key: string) {
  const hit = snapshotCache.get(key);
  if (!hit || Date.now() - hit.at > TTL_MS) return undefined;
  return hit.snap;
}
function writeCache(key: string, snap: PermissionSnapshot) {
  if (snapshotCache.size >= MAX_ENTRIES) {
    const oldest = snapshotCache.keys().next().value;
    if (oldest !== undefined) snapshotCache.delete(oldest);
  }
  snapshotCache.set(key, { at: Date.now(), snap });
}

export interface SessionAuthz {
  userId: string;
  snapshot: PermissionSnapshot;
}

/** Una sola resolución por petición (React cache) y por versión (LRU). */
export const getSessionAuthz = cache(async (): Promise<SessionAuthz | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const authz = claims.app_authz as AuthzClaims | undefined;
  const key = `${claims.sub}:${authz?.v ?? 0}`;
  const cached = readCache(key);
  if (cached) return { userId: claims.sub, snapshot: cached };

  const { data: snap, error } = await supabase.rpc("get_my_permissions");
  // Retornar null en lugar de lanzar: React cache() almacena el rechazo y lo
  // re-lanza en cualquier otro componente del árbol que llame esta función,
  // escapando los try/catch intermedios. Con null el layout y las páginas
  // continúan sin snapshot (acceso controlado por el middleware).
  if (error) return null;
  writeCache(key, snap as PermissionSnapshot);
  return { userId: claims.sub, snapshot: snap as PermissionSnapshot };
});

/** Guard de página/layout: redirige si no puede abrir la opción. */
export async function requireOption(optionCode: string, action: Action = "READ") {
  const session = await getSessionAuthz();
  if (!session) redirect("/login");
  if (!canOption(session.snapshot, optionCode, action)) redirect("/acceso-denegado");
  return session;
}

export class ForbiddenError extends Error {
  constructor(public readonly detail: string) {
    super(`FORBIDDEN: ${detail}`);
  }
}

/**
 * Guard de Server Action / Route Handler. Úsalo para PRINT, DOWNLOAD, UPLOAD y EXECUTE,
 * que RLS no puede distinguir de un SELECT/INSERT comunes.
 */
export async function requirePermission(optionCode: string, table: string, action: Action) {
  const session = await getSessionAuthz();
  if (!session) throw new ForbiddenError("sin sesión");
  if (!canResource(session.snapshot, optionCode, table, action)) {
    throw new ForbiddenError(`${action} sobre ${table} en ${optionCode}`);
  }
  return session;
}
