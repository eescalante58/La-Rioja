import Image from "next/image";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { metaHref, metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { BTN_OUTLINE_WHITE, BTN_YELLOW } from "@/components/site/section-ui";

interface AboutCtaProps {
  /** Fila `cl_cierre`. */
  closing: CmsSection | undefined;
}

/**
 * Banner final de Nosotros: foto de taller bajo una capa azul y botones a
 * Programas (contorno) y Apóyanos (amarillo).
 */
export function AboutCta({ closing }: AboutCtaProps) {
  if (!closing) return null;
  const photo = sectionImage(closing);
  const highlight = metaText(closing, "resaltado", "");

  return (
    <section className="relative overflow-hidden bg-[#0A0C14] text-white">
      <AuroraBackground />
      {photo && (
        <Image src={photo} alt="" fill sizes="100vw" className="object-cover opacity-[0.14]" />
      )}
      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 md:py-24">
        <h2 className="m-0 max-w-[860px] font-montserrat text-[clamp(30px,4vw,52px)] font-extrabold leading-[1.1] text-balance">
          {textOr(closing.title, "Sé parte de")}
          {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
        </h2>
        {closing.description && (
          <p className="m-0 max-w-[680px] whitespace-pre-line text-base leading-relaxed text-white/90 sm:text-lg">
            {closing.description}
          </p>
        )}
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href={metaHref(closing, "enlace_1", "/programs")}
            className={`${BTN_OUTLINE_WHITE} min-h-[54px] rounded-full text-[17px]`}
          >
            {metaText(closing, "boton_1", "Ver programas")}
          </Link>
          <Link
            href={metaHref(closing, "enlace_2", "/apoyanos")}
            className={`${BTN_YELLOW} min-h-[54px] rounded-full text-[17px]`}
          >
            {metaText(closing, "boton_2", "Apóyanos")}
          </Link>
        </div>
      </div>
    </section>
  );
}
