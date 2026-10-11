import { ChevronDown } from "lucide-react";
import type { CmsSection } from "@/lib/cms-content";
import { SECTION_PLAIN, SECTION_Y, H2 } from "./support-ui";

interface SupportFaqProps {
  /** Filas `apoyanos_faq_N` (title = pregunta, description = respuesta). */
  faqs: CmsSection[];
}

/**
 * Preguntas frecuentes (#preguntas): acordeón nativo `<details>` (sin
 * JavaScript) con la primera pregunta abierta.
 */
export function SupportFaq({ faqs }: SupportFaqProps) {
  const items = faqs.filter((f) => f.title && f.description);
  if (items.length === 0) return null;

  return (
    <section id="preguntas" className={SECTION_PLAIN}>
      <div className={`mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 sm:px-6 ${SECTION_Y}`}>
        <h2 className={`${H2} m-0 text-center`}>Preguntas frecuentes</h2>
        <div className="flex flex-col gap-2.5">
          {items.map((f, i) => (
            <details
              key={f.section_key}
              open={i === 0}
              className="group overflow-hidden rounded-2xl border border-line bg-white dark:bg-surface-card"
            >
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-montserrat text-base font-bold text-larioja-azul focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-larioja-azul dark:text-white dark:focus-visible:outline-white sm:text-[17px] [&::-webkit-details-marker]:hidden">
                <span>{f.title}</span>
                <ChevronDown
                  size={22}
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="m-0 whitespace-pre-line px-5 pb-5 text-base leading-[1.65] text-gray-700 dark:text-white/80">
                {f.description}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
