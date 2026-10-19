import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  metaHref,
  metaStrings,
  metaText,
  sectionImage,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";
import {
  BTN_NAVY,
  CONTAINER,
  H2,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";

interface WorkshopGalleryProps {
  /** Fila `cl_talleres` (H2, subtítulo, materias complementarias y botón). */
  intro: CmsSection | undefined;
  /** Filas `cl_taller_N`; con `metadata.insignia` la tarjeta es la destacada. */
  workshops: CmsSection[];
}

/** Insignia verde de impacto del taller. */
function Impact({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span className="mt-auto inline-flex items-center gap-1.5 self-start text-[13px] font-bold text-larioja-verde-texto dark:text-larioja-verde">
      <Check size={16} strokeWidth={2.4} aria-hidden="true" />
      {text}
    </span>
  );
}

/** Foto del taller o, si no hay, bloque azul con su nombre (decorativo). */
function WorkshopMedia({
  workshop,
  sizes,
  priority,
}: {
  workshop: CmsSection;
  sizes: string;
  priority?: boolean;
}) {
  const photo = sectionImage(workshop);
  if (!photo) {
    return (
      <div
        aria-hidden="true"
        className="grid aspect-[16/10] w-full place-items-center bg-larioja-azul font-montserrat text-[22px] font-extrabold text-larioja-amarillo dark:bg-larioja-azul-profundo"
      >
        {workshop.title}
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] w-full">
      <Image
        src={photo}
        alt={metaText(workshop, "foto_alt", `Estudiantes en el taller de ${workshop.title ?? ""}`)}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

/**
 * «Talleres y formación para la vida» (#talleres): taller insignia a lo
 * ancho, tarjetas de los demás talleres, materias complementarias y botón a
 * los productos de los talleres.
 */
export function WorkshopGallery({ intro, workshops }: WorkshopGalleryProps) {
  const items = workshops.filter((w) => textOr(w.title, ""));
  const subjects = metaStrings(intro, "materias");
  const subjectsText = metaText(intro, "materias_texto", "");
  const button = metaText(intro, "boton", "");

  return (
    <section id="talleres" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8`}>
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <h2 className={`${H2} m-0`}>{textOr(intro?.title, "Aprender haciendo")}</h2>
          {intro?.description && (
            <p className={`m-0 whitespace-pre-line text-lg leading-relaxed ${MUTED}`}>
              {intro.description}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => {
              const badge = metaText(w, "insignia", "");
              if (badge) {
                return (
                  <article
                    key={w.section_key}
                    className="flex flex-col overflow-hidden rounded-[22px] bg-white sm:col-span-2 lg:col-span-3 lg:flex-row dark:bg-surface-card"
                  >
                    <div className="w-full lg:basis-[55%]">
                      <WorkshopMedia workshop={w} sizes="(max-width: 1023px) 100vw, 700px" />
                    </div>
                    <div className="flex flex-col justify-center gap-3.5 p-6 sm:p-8 lg:basis-[45%]">
                      <span className="self-start rounded-full border-2 border-larioja-azul bg-larioja-amarillo px-3 py-1 font-montserrat text-xs font-bold text-larioja-azul">
                        {badge}
                      </span>
                      <h3 className="m-0 font-montserrat text-[28px] font-extrabold text-larioja-azul dark:text-white">
                        {w.title}
                      </h3>
                      {w.description && (
                        <p className="m-0 whitespace-pre-line text-base leading-relaxed text-gray-700 dark:text-white/80">
                          {w.description}
                        </p>
                      )}
                      <Impact text={metaText(w, "impacto", "")} />
                    </div>
                  </article>
                );
              }
              return (
                <article
                  key={w.section_key}
                  className="flex flex-col overflow-hidden rounded-[20px] bg-white dark:bg-surface-card"
                >
                  <WorkshopMedia
                    workshop={w}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                  />
                  <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
                    <h3 className="m-0 font-montserrat text-xl font-bold text-larioja-azul dark:text-white">
                      {w.title}
                    </h3>
                    {w.description && (
                      <p className={`m-0 whitespace-pre-line text-[15px] leading-relaxed ${MUTED}`}>
                        {w.description}
                      </p>
                    )}
                    <Impact text={metaText(w, "impacto", "")} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {subjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[20px] bg-white p-6 dark:bg-surface-card">
            <h3 className="m-0 font-montserrat text-[17px] font-bold text-larioja-azul dark:text-white">
              {metaText(intro, "materias_titulo", "Materias complementarias")}
            </h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {subjects.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-larioja-azul px-3.5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-larioja-azul"
                >
                  {s}
                </li>
              ))}
            </ul>
            {subjectsText && (
              <p className={`m-0 min-w-0 flex-[1_1_260px] text-sm leading-normal ${MUTED}`}>
                {subjectsText}
              </p>
            )}
          </div>
        )}

        {button && (
          <div>
            <Link
              href={metaHref(intro, "enlace", "/productos")}
              className={`${BTN_NAVY} w-full rounded-full text-base sm:w-auto`}
            >
              {button}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
