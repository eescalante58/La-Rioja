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
    <section
      id="contenido"
      className="relative overflow-hidden bg-[#0A0C14] text-white pt-8 lg:pt-14 pb-16 lg:pb-20"
    >
      {/* Capa de iluminación Aurora (Preset Azul La Rioja) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-85 select-none"
        aria-hidden="true"
      >
        {/* Orbe focal inferior dominante (#012060) */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: "-120px",
            width: "1050px",
            height: "480px",
            backgroundColor: "#012060",
            filter: "blur(140px)",
            mixBlendMode: "screen",
          }}
        />
        {/* Aura lateral izquierda (#081738) */}
        <div
          className="absolute top-[28%] -left-28 w-[520px] h-[520px] rounded-full"
          style={{
            backgroundColor: "#081738",
            filter: "blur(120px)",
            mixBlendMode: "screen",
          }}
        />
        {/* Aura lateral derecha (#0A1E4A) */}
        <div
          className="absolute top-[22%] -right-28 w-[560px] h-[560px] rounded-full"
          style={{
            backgroundColor: "#0A1E4A",
            filter: "blur(125px)",
            mixBlendMode: "screen",
          }}
        />
        {/* Núcleo suavizador central (#0B2568) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
          style={{
            width: "380px",
            height: "380px",
            backgroundColor: "#0B2568",
            filter: "blur(165px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 flex flex-col lg:flex-row lg:items-center gap-12">
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
