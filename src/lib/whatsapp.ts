/** WhatsApp institucional de La Rioja (7731-0792), respaldo si el CMS no lo tiene. */
export const WHATSAPP_FALLBACK_DIGITS = "50377310792";

/**
 * Solo los dígitos de un número o enlace de WhatsApp (p. ej. del CMS
 * `social media / whatsapp`, que puede ser «https://wa.me/503…»).
 * Devuelve el número institucional si no hay dígitos suficientes.
 */
export function whatsappDigits(source: string | null | undefined): string {
  const digits = source?.replace(/\D/g, "") ?? "";
  return digits.length >= 8 ? digits : WHATSAPP_FALLBACK_DIGITS;
}

/** Enlace `wa.me` con el mensaje precargado (codificado). */
export function waLink(digits: string, text?: string): string {
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
