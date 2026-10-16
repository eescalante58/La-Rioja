import Image from "next/image";
import { Check } from "lucide-react";
import {
  metaHref,
  metaStrings,
  metaText,
  sectionImage,
  textOr,
  type CmsSection,
} from "@/lib/cms-content";
import { BTN_OUTLINE_WHITE, BTN_YELLOW, CONTAINER, EYEBROW } from "@/components/site/section-ui";

interface ProgramHeroProps {
  /** Fila `cl_hero` de la página Programas. */
  hero: CmsSection | undefined;
}

/**
 * Hero de Programas (#inicio): título con resaltado amarillo, subtítulo,
 * botones a admisión y talleres, franja de garantías y foto de un taller
 * (debajo del texto en celular).
 */
export function ProgramHero({ hero }: ProgramHeroProps) {
  const highlight = metaText(hero, "resaltado", hero ? "" : "construir un futuro");
  const guarantees = metaStrings(hero, "garantias");
  const photo = sectionImage(hero);

  return (
    <section id="inicio" className="relative bg-larioja-azul text-white dark:bg-larioja-azul-profundo">
      <div id="contenido" className="scroll-mt-24" />
      <div
        className={`${CONTAINER} flex flex-col items-center gap-10 pb-14 pt-10 lg:flex-row lg:gap-12 lg:pb-16 lg:pt-14`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:basis-[54%]">
          <p className={EYEBROW}>{metaText(hero, "antetitulo", "Programas")}</p>
          <h1 className="m-0 font-montserrat text-[clamp(34px,4.6vw,58px)] font-extrabold leading-[1.08] tracking-[-0.01em] text-balance">
            {textOr(hero?.title, "Aprender un oficio, ganar autonomía,")}
            {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
          </h1>
          {hero?.description && (
            <p className="m-0 max-w-[600px] text-base leading-relaxed text-white/90 sm:text-lg">
              {hero.description}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            <a
              href={metaHref(hero, "enlace_1", "#admision")}
              className={`${BTN_YELLOW} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_1", "Solicitar información de ingreso")}
            </a>
            <a
              href={metaHref(hero, "enlace_2", "#talleres")}
              className={`${BTN_OUTLINE_WHITE} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_2", "Explorar talleres")}
            </a>
          </div>
          {guarantees.length > 0 && (
            <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-6 gap-y-3 border-t border-white/15 p-0 pt-5 sm:grid-cols-2">
              {guarantees.map((g) => (
                <li key={g} className="flex items-center gap-2.5 text-[15px] text-white/90">
                  <Check
                    size={20}
                    strokeWidth={2.4}
                    className="shrink-0 text-larioja-amarillo"
                    aria-hidden="true"
                  />
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        {photo && (
          <div className="relative aspect-[4/3] w-full min-w-0 flex-1 overflow-hidden rounded-[20px] lg:basis-[46%]">
            <Image
              src={photo}
              alt={metaText(hero, "foto_alt", "Estudiantes en un taller del CFL La Rioja")}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 560px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
