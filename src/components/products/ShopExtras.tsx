import { metaText, textOr, type CmsSection } from "./shop-content";

interface GiftsBannerProps {
  /** Fila `productos_regalos` del CMS (si está inactiva no llega y no se muestra). */
  section: CmsSection;
  /** WhatsApp de pedidos de la tienda (solo dígitos). */
  whatsappDigits?: string;
}

/**
 * Tarjeta amarilla de regalos empresariales con botón «Cotizar regalos»
 * que abre WhatsApp con un mensaje prellenado (editable en el CMS).
 */
export function GiftsBanner({ section, whatsappDigits }: GiftsBannerProps) {
  const label = metaText(section, "etiqueta", "");
  const button = metaText(section, "boton", "Cotizar regalos");
  const message = metaText(
    section,
    "mensaje_whatsapp",
    "Hola, quiero cotizar regalos empresariales de La Rioja Shop.",
  );
  const href = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    : undefined;

  return (
    <section
      id="regalos"
      className="mx-auto max-w-[1200px] px-6 pt-12 pb-6 scroll-mt-[110px] md:scroll-mt-[150px]"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 rounded-[28px] bg-[#F9C637] p-8 md:p-12">
        <div className="flex flex-1 flex-col gap-3.5 min-w-0">
          {label && (
            <span className="text-[15px] font-bold uppercase tracking-[0.06em] text-[#3A2A0E]">
              {label}
            </span>
          )}
          <h2 className="font-montserrat font-extrabold text-3xl md:text-[40px] leading-[1.1] text-[#1E2430] break-words">
            {textOr(section.title, "Regalos empresariales con impacto")}
          </h2>
          {section.description && (
            <p className="text-lg leading-relaxed text-[#2E2A22] whitespace-pre-line">
              {section.description}
            </p>
          )}
        </div>
        {href && button && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center self-start md:self-auto rounded-full bg-[#174C6B] px-7 text-[17px] font-bold text-white hover:bg-[#0F3349] transition-colors"
          >
            {button}
          </a>
        )}
      </div>
    </section>
  );
}

interface HowToBuyProps {
  /** Fila `productos_como_comprar` del CMS (título de la sección). */
  section: CmsSection;
  /** Filas `productos_paso_N` en el orden del CMS. */
  steps: CmsSection[];
}

/**
 * «Cómo comprar»: pasos numerados según su orden en el CMS.
 */
export function HowToBuy({ section, steps }: HowToBuyProps) {
  if (steps.length === 0) return null;
  return (
    <section id="como-comprar" className="mx-auto max-w-[1200px] px-6 pt-6 pb-16 md:pb-20">
      <h2 className="mb-7 font-montserrat font-extrabold text-3xl md:text-[40px] text-[#174C6B] dark:text-white">
        {textOr(section.title, "Cómo comprar")}
      </h2>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
        {steps.map((step, i) => (
          <li
            key={step.section_key}
            className="flex flex-col gap-2.5 rounded-[20px] bg-[#F5F1EA] dark:bg-slate-800 p-7"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#174C6B] text-xl font-extrabold text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <strong className="text-xl text-[#1E2430] dark:text-white">{step.title}</strong>
            {step.description && (
              <span className="leading-relaxed text-[#4A5260] dark:text-white/70 whitespace-pre-line">
                {step.description}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
