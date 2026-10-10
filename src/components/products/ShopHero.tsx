import Image from "next/image";
import { metaText, textOr, type CmsSection, type HeroPhoto } from "./shop-content";

interface ShopHeroProps {
  /** Fila `productos_hero` del CMS (puede faltar: se usan los textos por defecto). */
  hero?: CmsSection;
  /** Fotos de la cuadrícula (CMS o respaldo con fotos del catálogo). */
  photos: HeroPhoto[];
}

/** Desplazamiento escalonado de la cuadrícula 2×2 (solo en escritorio, como el mockup). */
const STAGGER = ["", "lg:mt-10", "lg:-mt-10", ""];

/**
 * Encabezado de La Rioja Shop: fondo azul fijo (#174C6B) con etiqueta,
 * título, texto y dos botones a la izquierda y una cuadrícula de fotos a la
 * derecha. Textos, enlaces y fotos se editan en el CMS (página `productos`).
 */
export function ShopHero({ hero, photos }: ShopHeroProps) {
  const badge = metaText(hero, "badge", "Hecho a mano en San Salvador · Colección 2025");
  const primary = {
    label: metaText(hero, "boton_1", "Ver productos"),
    href: metaText(hero, "boton_1_enlace", "#catalogo"),
  };
  const secondary = {
    label: metaText(hero, "boton_2", "Regalos para empresas"),
    href: metaText(hero, "boton_2_enlace", "#regalos"),
  };
  const external = (href: string) => /^https?:\/\//.test(href);

  return (
    <section className="bg-[#174C6B] text-white pt-40 md:pt-52 pb-16 lg:pb-20">
      <div className="mx-auto max-w-[1200px] px-6 flex flex-col lg:flex-row lg:items-center gap-12">
        <div className="flex flex-1 flex-col gap-5 min-w-0">
          {badge && (
            <span className="self-start rounded-full bg-white/[0.14] px-3.5 py-1.5 text-sm font-semibold">
              {badge}
            </span>
          )}
          <h1 className="font-montserrat font-extrabold text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-tight break-words">
            {textOr(hero?.title, "Pan con propósito, arte y costura con oficio")}
          </h1>
          <p className="max-w-[560px] text-lg sm:text-xl leading-relaxed text-[#DCE6EE]">
            {textOr(
              hero?.description,
              "Todo lo que ves lo elaboran los estudiantes de los talleres de panadería, arte y costura de La Rioja. Cada compra apoya su formación y su futuro laboral.",
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {primary.label && (
              <a
                href={primary.href}
                {...(external(primary.href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex min-h-12 items-center rounded-full bg-[#F9C637] px-6 text-[17px] font-bold text-[#1E2430] hover:brightness-105 transition"
              >
                {primary.label}
              </a>
            )}
            {secondary.label && (
              <a
                href={secondary.href}
                {...(external(secondary.href)
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-6 text-[17px] font-bold text-white hover:bg-white/10 transition"
              >
                {secondary.label}
              </a>
            )}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-[600px]">
            {photos.map((photo, i) => (
              <div
                key={photo.src}
                className={`relative aspect-square overflow-hidden rounded-[20px] bg-white ${STAGGER[i] ?? ""}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className={photo.contain ? "object-contain p-4" : "object-cover"}
                  priority={i < 2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
