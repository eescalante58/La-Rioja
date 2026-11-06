// lib/security/types.ts — tipos y reglas compartidas (servidor, proxy y cliente)

export const ACTION_BITS = {
  READ: 1,
  WRITE: 2,
  UPDATE: 4,
  DELETE: 8,
  PRINT: 16,
  DOWNLOAD: 32,
  UPLOAD: 64,
  EXECUTE: 128,
  ALL: 255,
} as const;

export type Action = keyof typeof ACTION_BITS;

/** Claims compactos que viajan en el JWT (claim `app_authz`). */
export interface AuthzClaims {
  /** Versión de permisos al emitir el token. */
  v: number;
  /** Superadministrador. */
  sa: boolean;
  /** Códigos de módulos que el usuario administra. */
  ma: string[];
  /** Máscara por opción: { CFG_COMPANIES: 255, ... } */
  o: Record<string, number>;
}

/** Mapa completo devuelto por la RPC get_my_permissions(). */
export interface PermissionSnapshot extends AuthzClaims {
  /** Máscara por recurso, clave "OPCION:tabla": { "BIL_INVOICES:facturas": 55 } */
  r: Record<string, number>;
}

export function hasBits(mask: number | undefined, action: Action): boolean {
  const bit = ACTION_BITS[action];
  return mask !== undefined && (mask & bit) === bit;
}

/** Nivel 2: ¿puede abrir/ejecutar la opción? */
export function canOption(
  claims: AuthzClaims | null | undefined,
  optionCode: string,
  action: Action = 'READ',
): boolean {
  if (!claims) return false;
  if (claims.sa) return true;
  return hasBits(claims.o[optionCode], action);
}

/** Nivel 3: ¿puede ejecutar la operación sobre la tabla dentro de la opción? */
export function canResource(
  snap: PermissionSnapshot | null | undefined,
  optionCode: string,
  table: string,
  action: Action,
): boolean {
  if (!snap) return false;
  if (snap.sa) return true;
  return hasBits(snap.r[`${optionCode}:${table}`], action);
}

/** Nivel 1: el módulo es visible si alguna de sus opciones lo es. */
export function canModule(
  claims: AuthzClaims | null | undefined,
  moduleCode: string,
  optionCodesOfModule: readonly string[],
): boolean {
  if (!claims) return false;
  if (claims.sa || claims.ma.includes(moduleCode)) return true;
  return optionCodesOfModule.some((code) => canOption(claims, code, 'READ'));
}
