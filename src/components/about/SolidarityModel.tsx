import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { metaHref, metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { RichText } from "@/components/apoyanos/RichText";
import {
  BODY,
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";

interface SolidarityModelProps {
  /** Fila `cl_solidario` (H2, párrafos y dato destacado). */
  intro: CmsSection | undefined;
  /** Filas `cl_fuente_N` (fuentes de ingreso con enlace opcional). */
  sources: CmsSection[];
}

/**
 * «Modelo solidario» (#sostenibilidad): cuotas según estudio socioeconómico,
 * dato destacado («7 de 10») y las fuentes complementarias de ingreso.
 */
export function SolidarityModel({ intro, sources }: SolidarityModelProps) {
  const figure = metaText(intro, "dato", "");
  const figureText = metaText(intro, "dato_texto", "");
  const items = sources.filter((s) => textOr(s.title, ""));

  return (
    <section id="sostenibilidad" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-9`}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
          <div className="flex min-w-0 flex-col gap-4 lg:basis-[65%]">
            <h2 className={`${H2} m-0`}>
              {textOr(intro?.title, "Un modelo solidario para que nadie se quede fuera")}
            </h2>
            <RichText
              text={intro?.description}
              className={`m-0 text-[17px] leading-[1.75] ${BODY}`}
            />
          </div>
          {figure && (
            <p className="m-0 flex flex-col gap-2 rounded-[22px] bg-larioja-azul p-6 text-white sm:p-8 lg:basis-[35%] dark:border dark:border-white/10 dark:bg-larioja-azul-profundo">
              <span className="font-montserrat text-[clamp(48px,6vw,64px)] font-extrabold leading-none text-larioja-amarillo">
                {figure}
              </span>
              {figureText && <span className="text-[17px] leading-normal">{figureText}</span>}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((s) => {
              const linkText = metaText(s, "enlace_texto", "");
              const href = metaHref(s, "enlace", "");
              return (
                <article
                  key={s.section_key}
                  className="flex flex-col gap-2.5 rounded-[18px] bg-white p-6 dark:bg-surface-card"
                >
                  <h3 className="m-0 font-montserrat text-[19px] font-bold text-larioja-azul dark:text-white">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className={`m-0 whitespace-pre-line text-[15px] leading-relaxed ${MUTED}`}>
                      {s.description}
                    </p>
                  )}
                  {linkText && href && (
                    <Link
                      href={href}
                      className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start font-montserrat text-[15px] font-bold text-larioja-azul-enlace underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace dark:text-larioja-amarillo dark:focus-visible:outline-larioja-amarillo"
                    >
                      {linkText}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
