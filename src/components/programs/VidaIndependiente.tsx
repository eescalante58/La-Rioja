import Image from "next/image";
import {
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";
import type { Workshop } from "./types";

/**
 * Bloque «Habilidades para la vida independiente»: Huerto, Computación y Artística.
 * Aparece a continuación de la cuadrícula de talleres productivos.
 * Server Component.
 */
export function VidaIndependiente({ workshops }: { workshops: Workshop[] }) {
  if (workshops.length === 0) return null;

  return (
    <section id="vida-independiente" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-7`}>
        <div className="flex max-w-[780px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>Habilidades para la vida independiente</h2>
          <p className={`m-0 text-lg leading-relaxed ${MUTED}`}>
            Además de los talleres vocacionales, los estudiantes desarrollan capacidades esenciales
            para su autonomía, convivencia y vida diaria.
          </p>
        </div>

        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {workshops.map((w) => (
            <li key={w.slug}>
              <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white dark:bg-surface-card">
                {w.image && (
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={w.image.url}
                      alt={w.image.alt}
                      fill
                      sizes="(max-width: 639px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-[22px]">
                  <h3 className="m-0 font-montserrat text-[21px] font-bold text-larioja-azul dark:text-white">
                    {w.name}
                  </h3>
                  {w.skills && (
                    <p className={`m-0 text-sm leading-normal ${MUTED}`}>
                      <strong className="text-larioja-azul dark:text-white">Habilidades:</strong>{" "}
                      {w.skills}
                    </p>
                  )}
                  {w.impact && (
                    <p className={`m-0 text-sm leading-normal ${MUTED}`}>
                      <strong className="text-larioja-azul dark:text-white">
                        Impacto en la vida diaria:
                      </strong>{" "}
                      {w.impact}
                    </p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
