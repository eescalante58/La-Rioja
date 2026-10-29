/**
 * Utilidades para construir y configurar las cookies de atribución de Google Ads:
 * `_gcl_aw` (Google Click ID - gclid), `_gcl_gb` (gbraid) y `_gcl_ag` (wbraid).
 */

/**
 * Construye el valor de la cookie `_gcl_*` según el estándar de Conversion Linker de Google:
 * `GCL.<timestamp_seconds>.<click_id>`
 * @param clickId Valor de `gclid`, `gbraid` o `wbraid` proveniente de la URL.
 */
export function buildGclCookie(clickId: string): string {
  const timestampSeconds = Math.floor(Date.now() / 1000);
  return `GCL.${timestampSeconds}.${clickId.trim()}`;
}

/**
 * Extrae el `gclid` limpio desde una cookie `_gcl_aw` con formato `GCL.<ts>.<gclid>`.
 */
export function extractGclidFromCookie(cookieValue: string | undefined): string | undefined {
  if (!cookieValue) return undefined;
  const parts = cookieValue.split(".");
  if (parts.length >= 3 && parts[0] === "GCL") {
    return parts.slice(2).join(".");
  }
  return cookieValue;
}

/**
 * Opciones de cookie requeridas por Google Conversion Linker:
 * - Duración: 90 días
 * - `httpOnly: false` para que `gtag.js` en navegador pueda leerla
 * - `sameSite: 'lax'`
 */
export const GOOGLE_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 90, // 90 días en segundos
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: false,
};
