/**
 * Utilidades para construir y configurar las cookies de atribución de Meta:
 * `_fbc` (Facebook Click ID) y `_fbp` (Facebook Browser ID).
 */

/**
 * Construye el valor de la cookie `_fbc` según el estándar de Meta:
 * `fb.1.<timestamp_ms>.<fbclid>`
 * @param fbclid Identificador de clic proveniente del parámetro URL `?fbclid=...`
 */
export function buildFbcCookie(fbclid: string): string {
  const timestamp = Date.now();
  return `fb.1.${timestamp}.${fbclid.trim()}`;
}

/**
 * Construye el valor de la cookie `_fbp` según el estándar de Meta:
 * `fb.1.<timestamp_ms>.<10_digitos_aleatorios>`
 */
export function buildFbpCookie(): string {
  const timestamp = Date.now();
  const random = Math.floor(1000000000 + Math.random() * 9000000000);
  return `fb.1.${timestamp}.${random}`;
}

/**
 * Opciones de cookie requeridas por Meta Pixel + CAPI:
 * - Duración: 90 días
 * - `httpOnly: false` para permitir lectura desde `fbevents.js` en cliente
 * - `sameSite: 'lax'`
 */
export const FB_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 90, // 90 días en segundos
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  httpOnly: false,
};
