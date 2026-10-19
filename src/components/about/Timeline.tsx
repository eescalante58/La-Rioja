import { metaText, textOr, type CmsSection } from "@/lib/cms-content";
import { RichText } from "@/components/apoyanos/RichText";
import {
  BODY,
  CONTAINER,
  H2,
  SECTION_ANCHOR,
  SECTION_PLAIN,
  SECTION_Y,
} from "@/components/site/section-ui";

interface TimelineProps {
  /** Fila `cl_historia` (H2 + introducción). */
  intro: CmsSection | undefined;
  /** Filas `cl_hito_N`: title = años, description = detalle, metadata {titulo, actual}. */
  milestones: CmsSection[];
}

/**
 * «Historia y raíces» (#historia): párrafo institucional de ASPAPREM y
 * línea de tiempo vertical en celular y horizontal desde `lg`. El hito
 * actual (`metadata.actual = "si"`) lleva el punto en amarillo.
 */
export function Timeline({ intro, milestones }: TimelineProps) {
  const items = milestones.filter((m) => textOr(m.title, ""));

  return (
    <section id="historia" className={`${SECTION_PLAIN} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-11`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-16">
          <h2 className={`${H2} m-0 lg:basis-[38%]`}>
            {textOr(intro?.title, "Una historia que empezaron las familias")}
          </h2>
          {intro?.description && (
            <div className="flex flex-col gap-4 lg:basis-[62%]">
              <RichText
                text={intro.description}
                className={`m-0 text-[17px] leading-[1.75] ${BODY}`}
              />
            </div>
          )}
        </div>

        {items.length > 0 && (
          <ol className="relative m-0 grid list-none gap-8 border-l-2 border-larioja-azul p-0 pl-6 dark:border-white/40 lg:grid-flow-col lg:auto-cols-fr lg:gap-6 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-8">
            {items.map((m) => {
              const current = metaText(m, "actual", "") !== "";
              const title = metaText(m, "titulo", "");
              return (
                <li
                  key={m.section_key}
                  className="relative"
                  aria-current={current ? "step" : undefined}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-[3px] border-larioja-azul dark:border-white lg:-top-[41px] lg:left-0 ${
                      current ? "bg-larioja-amarillo" : "bg-white dark:bg-larioja-azul"
                    }`}
                  />
                  <p className="m-0 font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-white">
                    {m.title}
                  </p>
                  {title && (
                    <h3 className="m-0 mt-1 font-montserrat text-lg font-bold text-larioja-azul dark:text-white">
                      {title}
                    </h3>
                  )}
                  {m.description && (
                    <p className="m-0 mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-white/70">
                      {m.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
