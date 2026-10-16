import Image from "next/image";
import { ArrowRight, Check, Wheat } from "lucide-react";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { TrackedLink } from "./TrackedLink";
import { BTN_OUTLINE_WHITE, BTN_YELLOW, CONTAINER } from "./support-ui";

interface SupportHeroProps {
  /** Fila `apoyanos_hero`. */
  hero: CmsSection | undefined;
  /** Filas `apoyanos_credencial_N` (franja de credibilidad). */
  credentials: CmsSection[];
}

/**
 * Hero de Apóyanos (#inicio): propósito, botones «Quiero donar hoy» y
 * «Conoce nuestro impacto», franja de credibilidad y foto del taller.
 */
export function SupportHero({ hero, credentials }: SupportHeroProps) {
  const eyebrow = metaText(hero, "antetitulo", "");
  const highlight = metaText(hero, "resaltado", "");
  const photo = sectionImage(hero);
  const badgeTitle = metaText(hero, "insignia_titulo", "");
  const badgeText = metaText(hero, "insignia_texto", "");
  const items = credentials.map((c) => textOr(c.title, "")).filter(Boolean);

  return (
    <section id="inicio" className="relative bg-larioja-azul text-white dark:bg-larioja-azul-profundo">
      <div id="contenido" className="scroll-mt-24" />
      <div
        className={`${CONTAINER} flex flex-col items-center gap-10 pb-14 pt-10 lg:flex-row lg:gap-12 lg:pb-16 lg:pt-14`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:basis-[55%]">
          {eyebrow && (
            <p className="m-0 font-montserrat text-[13px] font-bold uppercase tracking-[0.08em] text-larioja-amarillo">
              {eyebrow}
            </p>
          )}
          <h1 className="m-0 font-montserrat text-[clamp(32px,4.6vw,58px)] font-extrabold leading-[1.08] tracking-[-0.01em] text-balance">
            {textOr(hero?.title, "Apóyanos")}
            {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
          </h1>
          {hero?.description && (
            <p className="m-0 max-w-[600px] text-base leading-relaxed text-white/90 sm:text-lg">
              {hero.description}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-1.5 sm:flex-row sm:flex-wrap">
            <TrackedLink
              href="#donar"
              event="donar"
              origin="hero"
              className={`${BTN_YELLOW} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_1", "Quiero donar hoy")}
              <ArrowRight size={20} aria-hidden="true" />
            </TrackedLink>
            <a
              href="#impacto"
              className={`${BTN_OUTLINE_WHITE} min-h-[54px] w-full rounded-full text-[17px] sm:w-auto`}
            >
              {metaText(hero, "boton_2", "Conoce nuestro impacto")}
            </a>
          </div>
          {items.length > 0 && (
            <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-6 gap-y-3 border-t border-white/15 p-0 pt-5 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                  <Check size={20} className="shrink-0 text-larioja-amarillo" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {photo && (
          <div className="relative w-full min-w-0 flex-1 lg:basis-[45%]">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px]">
              <Image
                src={photo}
                alt={metaText(hero, "foto_alt", "Estudiantes de La Rioja en el taller")}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 560px"
                className="object-cover"
              />
            </div>
            {(badgeTitle || badgeText) && (
              <div className="absolute bottom-3 left-3 right-3 flex max-w-[300px] items-center gap-3 rounded-[14px] bg-white p-3 text-larioja-azul shadow-[0_8px_24px_rgba(1,22,64,0.25)] sm:bottom-4 sm:left-4 sm:px-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-larioja-verde text-white">
                  <Wheat size={22} aria-hidden="true" />
                </span>
                <span className="text-[13px] leading-snug">
                  {badgeTitle && <strong className="font-montserrat">{badgeTitle}</strong>}
                  {badgeTitle && badgeText && <br />}
                  {badgeText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
