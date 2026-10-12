import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { metaHref, metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { BTN_OUTLINE_WHITE, BTN_YELLOW, CONTAINER, EYEBROW } from "@/components/site/section-ui";

interface AboutHeroProps {
  /** Fila `cl_hero`. */
  hero: CmsSection | undefined;
}

/**
 * Hero de Nosotros (#inicio): lema, subtítulo, insignia de trayectoria
 * («Desde 1993»), botones a la historia y a Programas, y foto del grupo
 * (debajo del texto en celular).
 */
export function AboutHero({ hero }: AboutHeroProps) {
  const eyebrow = metaText(hero, "antetitulo", "Nosotros");
  const highlight = metaText(hero, "resaltado", "");
  const badge = metaText(hero, "insignia", "");
  const badgeText = metaText(hero, "insignia_texto", "");
  const photo = sectionImage(hero);

  return (
    <section id="inicio" className="bg-larioja-azul text-white dark:bg-larioja-azul-profundo">
      <div
        className={`${CONTAINER} flex flex-col items-center gap-10 pb-14 pt-10 lg:flex-row lg:gap-12 lg:pb-16 lg:pt-14`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:basis-[52%]">
          <p className={EYEBROW}>{eyebrow}</p>
          <h1 className="m-0 font-montserrat text-[clamp(34px,5vw,62px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-balance">
            {textOr(hero?.title, "Formando futuros,")}
            {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
          </h1>
          {hero?.description && (
            <p className="m-0 max-w-[580px] text-base leading-relaxed text-white/90 sm:text-lg">
              {hero.description}
            </p>
          )}
          {badge && (
            <div className="flex max-w-full items-center gap-3.5 self-start rounded-2xl border border-white/15 bg-white/[0.08] py-3 pl-3 pr-4 sm:pr-5">
              <span className="shrink-0 rounded-xl bg-larioja-amarillo px-3.5 py-2.5 font-montserrat text-lg font-extrabold leading-none text-larioja-azul sm:text-xl">
                {badge}
              </span>
              {badgeText && (
                <span className="min-w-0 text-sm leading-snug text-white/90">{badgeText}</span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            <a
              href="#historia"
              className={`${BTN_YELLOW} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_1", "Conoce nuestra historia")}
              <ArrowDown size={20} aria-hidden="true" />
            </a>
            <Link
              href={metaHref(hero, "enlace_2", "/programs")}
              className={`${BTN_OUTLINE_WHITE} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_2", "Ver programas")}
            </Link>
          </div>
        </div>

        {photo && (
          <div className="relative aspect-[16/10] w-full min-w-0 flex-1 overflow-hidden rounded-[20px] lg:basis-[48%]">
            <Image
              src={photo}
              alt={metaText(hero, "foto_alt", "Estudiantes del CFL La Rioja reunidos")}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 600px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
