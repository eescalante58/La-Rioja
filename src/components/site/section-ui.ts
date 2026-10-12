/**
 * Clases compartidas de la página Apóyanos (diseño «Apóyanos — Escritorio»).
 * Colores con los tokens de marca (`larioja-*`, `whatsapp`, `line`, `surface-card`).
 */

/** Contenedor de 1280 px con 16 px de margen lateral en celular. */
export const CONTAINER = "mx-auto w-full max-w-screen-xl px-4 sm:px-6";

/** Espaciado vertical de cada sección. */
export const SECTION_Y = "py-16 md:py-20";

/** Sección con fondo gris claro (alterna con las blancas). */
export const SECTION_TINT = "bg-[#F3F5F8] dark:bg-slate-900/50";

/** Sección blanca. */
export const SECTION_PLAIN = "bg-white dark:bg-larioja-azul";

/** Título H2 de sección. */
export const H2 =
  "font-montserrat font-extrabold text-[clamp(28px,3.4vw,42px)] leading-[1.12] text-larioja-azul dark:text-white text-balance";

/** Título H3 de bloque. */
export const H3 = "font-montserrat font-bold text-[22px] md:text-2xl text-larioja-azul dark:text-white";

/** Texto de cuerpo. */
export const BODY = "text-gray-700 dark:text-white/80";

/** Texto secundario. */
export const MUTED = "text-gray-600 dark:text-white/70";

/** Tarjeta blanca con borde. */
export const CARD = "bg-white dark:bg-surface-card border border-line";

const BTN_BASE =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 px-6 text-center font-montserrat text-base font-bold no-underline transition-[filter,background-color] hover:brightness-95 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/** Botón amarillo (acción principal de donar). */
export const BTN_YELLOW = `${BTN_BASE} bg-larioja-amarillo text-larioja-azul focus-visible:outline-larioja-azul dark:focus-visible:outline-white`;

/** Botón azul de marca. */
export const BTN_NAVY = `${BTN_BASE} bg-larioja-azul text-white focus-visible:outline-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul dark:focus-visible:outline-white`;

/** Botón de WhatsApp. */
export const BTN_WHATSAPP = `${BTN_BASE} bg-whatsapp text-whatsapp-ink focus-visible:outline-larioja-azul dark:focus-visible:outline-white`;

/** Botón con contorno blanco (sobre fondo azul). */
export const BTN_OUTLINE_WHITE = `${BTN_BASE} border-2 border-white text-white font-semibold hover:bg-white/10 focus-visible:outline-white`;

/** Botón con contorno azul (sobre fondo claro). */
export const BTN_OUTLINE = `${BTN_BASE} border-2 border-larioja-azul text-larioja-azul font-semibold hover:bg-larioja-azul/5 focus-visible:outline-larioja-azul dark:border-white dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-white`;
