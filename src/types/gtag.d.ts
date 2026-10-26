/**
 * Tipado global para Google Tag (gtag.js) y dataLayer.
 * Utilizado por la etiqueta base de Google Ads y futuros eventos de conversión (p. ej. clic en WhatsApp).
 */
export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "set" | "event" | "consent" | "js",
      targetIdOrAction: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}
