/**
 * Utilidades para resolver mensajes y enlaces de WhatsApp en el módulo de matrícula.
 * No depende de APIs de servidor para poder usarse tanto en Client Components como Server Components.
 */

/**
 * Resuelve la plantilla de WhatsApp con los datos del formulario y genera la URL wa.me segura.
 */
export function resolveWhatsAppUrl(params: {
  template: string;
  phoneE164: string;
  year: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  type: string;
  message: string;
}): string {
  const { template, phoneE164, year, name, email, phone, type, message } = params;

  const resolved = template
    .replace(/\{year\}/g, String(year))
    .replace(/\{name\}/g, name.trim())
    .replace(/\{email\}/g, (email && email.trim()) || "No indicado")
    .replace(/\{phone\}/g, (phone && phone.trim()) || "No indicado")
    .replace(/\{type\}/g, type.trim())
    .replace(/\{message\}/g, message.trim());

  // Limpiar caracteres no numéricos del teléfono salvo el + inicial
  const digits = phoneE164.replace(/[^\d]/g, "");

  return `https://wa.me/${digits}?text=${encodeURIComponent(resolved)}`;
}
