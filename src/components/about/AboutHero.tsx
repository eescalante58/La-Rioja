import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
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
  const eyebrow = metaText(hero, "antetitulo", "Quiénes Somos");
  const highlight = metaText(hero, "resaltado", "");
  const badge = metaText(hero, "insignia", "");
  const badgeText = metaText(hero, "insignia_texto", "");
  const photo = sectionImage(hero);

  const cardTitulo =
    metaText(hero, "card_foto_titulo", "") ||
    metaText(hero, "foto_card_titulo", "") ||
    "Comunidad La Rioja";
  const cardSubtitulo =
    metaText(hero, "card_foto_subtitulo", "") ||
    metaText(hero, "foto_card_subtitulo", "") ||
    "Educación, taller y convivencia";
  const cardTag =
    metaText(hero, "card_foto_tag", "") ||
    metaText(hero, "foto_card_tag", "") ||
    "ASPAPREM";

  return (
    <section id="inicio" className="relative overflow-hidden bg-[#0A0C14] text-white">
      <AuroraBackground />
      <div id="contenido" className="scroll-mt-24" />
      <div
        className={`relative z-10 ${CONTAINER} flex flex-col items-center gap-10 pb-14 pt-10 lg:flex-row lg:gap-12 lg:pb-16 lg:pt-14`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:basis-[52%]">
          <p className={EYEBROW}>{eyebrow}</p>
          <h1 className="m-0 font-montserrat text-[clamp(34px,5vw,62px)] font-extrabold leading-[1.05] tracking-[-0.01em] text-balance">
            {textOr(hero?.title, "Formando futuros,")}
            {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
          </h1>
          {hero?.description && (
            <p className="m-0 max-w-[580px] whitespace-pre-line text-base leading-relaxed text-white/90 sm:text-lg">
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
          <div className="w-full min-w-0 flex-1 lg:basis-[48%]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-white/10 bg-slate-800 shadow-2xl">
              <Image
                src={photo}
                alt={metaText(hero, "foto_alt", "Estudiantes del CFL La Rioja reunidos")}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 600px"
                className="object-cover"
              />
              {/* Gradiente sutil y tarjeta flotante solo en escritorio para no tapar la foto en celular */}
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-larioja-azul-profundo/80 via-transparent to-transparent" />
              <div className="hidden lg:flex absolute bottom-4 left-4 right-4 items-center justify-between rounded-2xl border border-white/20 bg-white/15 p-3 text-white backdrop-blur-md">
                <div>
                  <p className="text-xs font-bold">{cardTitulo}</p>
                  <p className="text-[11px] text-white/80">{cardSubtitulo}</p>
                </div>
                <span className="rounded-full bg-larioja-amarillo px-2.5 py-1 text-xs font-extrabold text-larioja-azul">
                  {cardTag}
                </span>
              </div>
            </div>

            {/* En móvil (< lg), los datos se muestran debajo de la foto para permitir apreciarla completamente */}
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-3.5 text-white shadow-sm backdrop-blur-md lg:hidden">
              <div>
                <p className="text-xs font-bold text-white">{cardTitulo}</p>
                <p className="text-[11px] text-white/80">{cardSubtitulo}</p>
              </div>
              <span className="rounded-full bg-larioja-amarillo px-2.5 py-1 text-xs font-extrabold text-larioja-azul shadow-sm">
                {cardTag}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
