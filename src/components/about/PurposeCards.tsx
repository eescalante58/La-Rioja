import type { LucideIcon } from "lucide-react";
import { Award, HeartHandshake, Lightbulb, Sparkles, Users } from "lucide-react";
import { metaText, textOr, type CmsSection } from "@/lib/cms-content";
import {
  CONTAINER,
  H2,
  H3,
  MUTED,
  SECTION_ANCHOR,
  SECTION_TINT,
  SECTION_Y,
} from "@/components/site/section-ui";

interface PurposeCardsProps {
  /** Fila `cl_proposito` (H2; metadata.titulo_valores). */
  intro: CmsSection | undefined;
  /** Fila `cl_mision`. */
  mission: CmsSection | undefined;
  /** Fila `cl_vision`. */
  vision: CmsSection | undefined;
  /** Filas `cl_valor_N`. */
  values: CmsSection[];
}

/** Icono de cada valor por nombre (sin acentos ni mayúsculas); otro nombre usa Sparkles. */
const VALUE_ICONS: Record<string, LucideIcon> = {
  compromiso: HeartHandshake,
  innovacion: Lightbulb,
  inclusion: Users,
  calidad: Award,
};

/** Normaliza el nombre de un valor para buscar su icono. */
function valueIcon(name: string): LucideIcon {
  const key = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return VALUE_ICONS[key] ?? Sparkles;
}

/** Brújula (misión), del diseño «Nosotros — Escritorio». */
function CompassIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  );
}

/** Montaña con bandera (visión), del diseño «Nosotros — Escritorio». */
function SummitIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 20l6-10 4 6 3-4 5 8z" />
      <path d="M13 9V3l4 2-4 2" />
    </svg>
  );
}

/**
 * «Propósito institucional» (#proposito): misión (tarjeta azul) y visión
 * (tarjeta con borde) con el texto oficial, y la cuadrícula de valores.
 */
export function PurposeCards({ intro, mission, vision, values }: PurposeCardsProps) {
  const valueItems = values.filter((v) => textOr(v.title, ""));

  return (
    <section id="proposito" className={`${SECTION_TINT} ${SECTION_ANCHOR}`}>
      <div className={`${CONTAINER} ${SECTION_Y} flex flex-col gap-8`}>
        <h2 className={`${H2} m-0`}>{textOr(intro?.title, "Lo que nos mueve")}</h2>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {mission && (
            <article className="flex flex-col gap-3.5 rounded-[22px] bg-larioja-azul p-6 text-white sm:p-8 dark:border dark:border-white/10 dark:bg-larioja-azul-profundo">
              <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-larioja-amarillo text-larioja-azul">
                <CompassIcon />
              </span>
              <h3 className="m-0 font-montserrat text-2xl font-extrabold">
                {textOr(mission.title, "Nuestra misión")}
              </h3>
              {mission.description && (
                <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-white/90">
                  {mission.description}
                </p>
              )}
            </article>
          )}
          {vision && (
            <article className="flex flex-col gap-3.5 rounded-[22px] border-2 border-larioja-azul bg-white p-6 sm:p-8 dark:border-white/40 dark:bg-surface-card">
              <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-larioja-azul text-larioja-amarillo">
                <SummitIcon />
              </span>
              <h3 className="m-0 font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-white">
                {textOr(vision.title, "Nuestra visión")}
              </h3>
              {vision.description && (
                <p className="m-0 whitespace-pre-line text-[17px] leading-[1.7] text-gray-700 dark:text-white/80">
                  {vision.description}
                </p>
              )}
            </article>
          )}
        </div>

        {valueItems.length > 0 && (
          <>
            <h3 className={`${H3} m-0 mt-4`}>
              {metaText(intro, "titulo_valores", "Nuestros valores")}
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {valueItems.map((v) => {
                const Icon = valueIcon(v.title ?? "");
                return (
                  <article
                    key={v.section_key}
                    className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-6 dark:bg-surface-card"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-larioja-verde/10 text-larioja-verde-texto dark:bg-larioja-verde/20 dark:text-larioja-verde">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h4 className="m-0 font-montserrat text-[19px] font-bold text-larioja-azul dark:text-white">
                      {v.title}
                    </h4>
                    {v.description && (
                      <p className={`m-0 whitespace-pre-line text-[15px] leading-relaxed ${MUTED}`}>
                        {v.description}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
