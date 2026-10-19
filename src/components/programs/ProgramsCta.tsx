import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { PrivacyNotice } from "@/components/layout/PrivacyNotice";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { waLink } from "@/lib/whatsapp";
import { BTN_OUTLINE_WHITE, BTN_YELLOW } from "@/components/site/section-ui";

interface ProgramsCtaProps {
  /** Fila `cl_cierre`. */
  closing: CmsSection | undefined;
  /** Dígitos del WhatsApp institucional. */
  whatsapp: string;
  /** Enlace de Google Maps (`social media / google maps`); vacío = sin botón. */
  mapsUrl: string;
}

/**
 * Banner final de Programas: «Ven a conocernos», con foto bajo una capa azul,
 * botón de WhatsApp para agendar la visita, «Cómo llegar» y datos de contacto.
 */
export function ProgramsCta({ closing, whatsapp, mapsUrl }: ProgramsCtaProps) {
  if (!closing) return null;
  const photo = sectionImage(closing);
  const highlight = metaText(closing, "resaltado", "");
  const contact = metaText(closing, "contacto", "");

  return (
    <section className="relative overflow-hidden bg-[#0A0C14] text-white">
      <AuroraBackground />
      {photo && (
        <Image src={photo} alt="" fill sizes="100vw" className="object-cover opacity-[0.14]" />
      )}
      <div className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 md:py-24">
        <h2 className="m-0 max-w-[860px] font-montserrat text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.1] text-balance">
          {textOr(closing.title, "Ven a")}
          {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
        </h2>
        {closing.description && (
          <p className="m-0 max-w-[680px] text-base leading-relaxed text-white/90 sm:text-lg">
            {closing.description}
          </p>
        )}
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <a
            href={waLink(
              whatsapp,
              metaText(
                closing,
                "mensaje_whatsapp",
                "Hola, quiero información para inscribir a un familiar en La Rioja",
              ),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BTN_YELLOW} min-h-[54px] rounded-full text-[17px]`}
          >
            <MessageCircle size={20} aria-hidden="true" />
            {metaText(closing, "boton_1", "Agendar una visita por WhatsApp")}
          </a>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_OUTLINE_WHITE} min-h-[54px] rounded-full text-[17px]`}
            >
              {metaText(closing, "boton_2", "Cómo llegar")}
            </a>
          )}
        </div>
        <PrivacyNotice variant="whatsapp" tone="dark" />
        {contact && <p className="m-0 text-[15px] text-white/90">{contact}</p>}
      </div>
    </section>
  );
}
