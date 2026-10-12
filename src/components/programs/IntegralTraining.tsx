import Image from "next/image";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import {
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";
import type { IntegralSubject } from "./types";

interface IntegralTrainingProps {
  /** Fila `cl_integral` (H2, subtítulo y foto). */
  intro: CmsSection | undefined;
  subjects: IntegralSubject[];
}

/**
 * «Formación que va más allá del taller» (#formacion-integral): materias
 * complementarias en tarjetas (dos columnas en celular, cuatro en escritorio).
 */
export function IntegralTraining({ intro, subjects }: IntegralTrainingProps) {
  if (subjects.length === 0) return null;
  const photo = sectionImage(intro);

  return (
    <section id="formacion-integral" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h2 className={`${H2} m-0`}>
              {textOr(intro?.title, "Formación que va más allá del taller")}
            </h2>
            {intro?.description && (
              <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>{intro.description}</p>
            )}
          </div>
          {photo && (
            <div className="relative aspect-[21/9] w-full min-w-0 flex-1 overflow-hidden rounded-[20px]">
              <Image
                src={photo}
                alt={metaText(intro, "foto_alt", "Estudiantes del CFL La Rioja")}
                fill
                sizes="(max-width: 1023px) 100vw, 600px"
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {subjects.map((s) => (
            <article
              key={s.key}
              className="flex min-w-0 flex-col gap-2 rounded-[18px] bg-white p-4 sm:p-6 dark:bg-surface-card"
            >
              {s.role && (
                <span className="self-start rounded-full bg-larioja-azul px-2.5 py-1 font-montserrat text-[11px] font-bold leading-tight text-larioja-amarillo sm:px-3 sm:text-xs dark:bg-larioja-amarillo dark:text-larioja-azul">
                  {s.role}
                </span>
              )}
              <h3 className="m-0 font-montserrat text-[17px] font-bold leading-snug text-larioja-azul sm:text-[19px] dark:text-white">
                {s.name}
              </h3>
              {s.text && (
                <p className={`m-0 text-sm leading-relaxed sm:text-[15px] ${MUTED}`}>{s.text}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
