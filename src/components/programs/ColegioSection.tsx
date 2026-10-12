import { GraduationCap } from "lucide-react";
import { metaText, textOr, type CmsSection } from "@/lib/cms-content";

interface ColegioSectionProps {
  /** Fila `programs_colegio` del CMS (página «programs»). */
  colegio: CmsSection | undefined;
}

/**
 * Sección #colegio de Programas: el Colegio La Rioja (educación formal de
 * 12 a 20 años). Es el destino del botón «Conocer el Colegio» de Nosotros.
 */
export function ColegioSection({ colegio }: ColegioSectionProps) {
  if (!colegio) return null;
  const eyebrow = metaText(colegio, "antetitulo", "");
  const age = metaText(colegio, "edad", "");

  return (
    <section className="bg-white pt-16 md:pt-24 dark:bg-larioja-azul">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <article
          id="colegio"
          className="flex scroll-mt-6 flex-col gap-6 rounded-3xl border border-line bg-[#F3F5F8] p-6 sm:p-10 md:flex-row md:items-start dark:bg-slate-900/50">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-larioja-azul text-larioja-amarillo">
            <GraduationCap size={32} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-3">
            {eyebrow && (
              <p className="m-0 font-montserrat text-[13px] font-bold uppercase tracking-[0.08em] text-larioja-verde-texto dark:text-larioja-verde">
                {eyebrow}
              </p>
            )}
            <h2 className="m-0 font-montserrat text-[clamp(26px,3.4vw,38px)] font-extrabold leading-tight text-larioja-azul dark:text-white">
              {textOr(colegio.title, "Colegio La Rioja")}
            </h2>
            {colegio.description && (
              <p className="m-0 text-lg leading-relaxed text-gray-700 dark:text-white/80">{colegio.description}</p>
            )}
            {age && (
              <span className="self-start rounded-full bg-larioja-amarillo px-3 py-1.5 font-montserrat text-[13px] font-bold text-larioja-azul">
                {age}
              </span>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
