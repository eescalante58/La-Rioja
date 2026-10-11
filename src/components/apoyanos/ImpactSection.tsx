import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { RichText } from "./RichText";
import {
  BODY,
  BTN_NAVY,
  CARD,
  CONTAINER,
  H2,
  H3,
  MUTED,
  SECTION_PLAIN,
  SECTION_Y,
} from "./support-ui";

interface ImpactSectionProps {
  /** Fila `apoyanos_reto` (H2, párrafos y metadata). */
  challenge: CmsSection | undefined;
  /** Filas `apoyanos_cifra_N`: se muestran solo las que tienen `metadata.valor`. */
  figures: CmsSection[];
  /** Filas `apoyanos_resultado_N`. */
  results: CmsSection[];
  /** Fila `apoyanos_testimonio` (solo llega si está activa). */
  testimonial: CmsSection | undefined;
}

/**
 * «El reto y nuestro impacto» (#impacto): por qué se necesita el apoyo,
 * cifras, tarjetas de resultado con foto y testimonio opcional.
 */
export function ImpactSection({ challenge, figures, results, testimonial }: ImpactSectionProps) {
  const shownFigures = figures.filter((f) => metaText(f, "valor", "") !== "");
  const resultsTitle = metaText(challenge, "titulo_resultados", "");
  const testimonialPhoto = sectionImage(testimonial);

  return (
    <section id="impacto" className={SECTION_PLAIN}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-12`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-16">
          <h2 className={`${H2} m-0 lg:basis-2/5`}>
            {textOr(challenge?.title, "El reto y nuestro impacto")}
          </h2>
          <div
            className={`flex flex-col gap-4 text-base leading-[1.7] sm:text-[17px] lg:basis-3/5 ${BODY}`}
          >
            <RichText text={challenge?.description} className="m-0" />
          </div>
        </div>

        {shownFigures.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
            {shownFigures.map((f) => (
              <li
                key={f.section_key}
                className="flex flex-col gap-2 rounded-[18px] bg-larioja-azul px-6 py-7 text-white dark:bg-larioja-azul-profundo dark:ring-1 dark:ring-white/10"
              >
                <span className="font-montserrat text-5xl font-extrabold leading-none text-larioja-amarillo">
                  {metaText(f, "valor", "")}
                </span>
                <span className="text-[15px] leading-normal text-white/90">{f.title}</span>
              </li>
            ))}
          </ul>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-6">
            {resultsTitle && <h3 className={`${H3} m-0 md:text-[26px]`}>{resultsTitle}</h3>}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((r) => {
                const photo = sectionImage(r);
                return (
                  <article
                    key={r.section_key}
                    className={`${CARD} flex flex-col overflow-hidden rounded-[18px]`}
                  >
                    {photo && (
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={photo}
                          alt={metaText(r, "foto_alt", textOr(r.title, ""))}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 300px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 p-5">
                      <h4 className="m-0 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
                        {r.title}
                      </h4>
                      {r.description && (
                        <p className={`m-0 text-[15px] leading-relaxed ${MUTED}`}>
                          {r.description}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {testimonial?.description && (
          <figure className="m-0 flex flex-wrap items-center gap-5 rounded-[18px] bg-[#F3F5F8] p-6 dark:bg-slate-900/50 sm:p-7">
            {testimonialPhoto && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                <Image src={testimonialPhoto} alt="" fill sizes="64px" className="object-cover" />
              </div>
            )}
            <blockquote className="m-0 min-w-0 flex-1 basis-[280px] font-montserrat text-lg font-semibold leading-normal text-larioja-azul dark:text-white sm:text-xl">
              “{testimonial.description}”
            </blockquote>
            {testimonial.title && (
              <figcaption className={`basis-full text-sm ${MUTED}`}>{testimonial.title}</figcaption>
            )}
          </figure>
        )}

        <div>
          <a href="#formas-de-apoyar" className={`${BTN_NAVY} w-full rounded-full sm:w-auto`}>
            {metaText(challenge, "boton", "Quiero ser parte")}
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
