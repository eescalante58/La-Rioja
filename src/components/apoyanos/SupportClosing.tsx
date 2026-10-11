import Image from "next/image";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { metaText, sectionImage, textOr, type CmsSection } from "@/lib/cms-content";
import { waLink } from "@/lib/whatsapp";
import { TrackedLink } from "./TrackedLink";
import { BTN_OUTLINE_WHITE, BTN_YELLOW } from "./support-ui";

interface SupportClosingProps {
  /** Fila `apoyanos_cierre`. */
  closing: CmsSection | undefined;
  whatsapp: string;
  email: string;
  /** Enlace de Instagram (CMS `social media / instagram`). */
  instagram: string;
}

/** Usuario de Instagram a partir del enlace del perfil (p. ej. «@larioja_sv»). */
function instagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  return match ? `@${match[1]}` : "";
}

/**
 * Cierre de la página: llamado final con foto de los estudiantes, botones
 * «Quiero donar hoy» y «Hablar con nosotros» (WhatsApp) y contacto directo.
 */
export function SupportClosing({ closing, whatsapp, email, instagram }: SupportClosingProps) {
  if (!closing) return null;
  const photo = sectionImage(closing);
  const highlight = metaText(closing, "resaltado", "");
  const phones = metaText(closing, "telefonos", "");
  const handle = instagramHandle(instagram);
  const link = "inline-flex min-h-[44px] items-center font-semibold text-white underline-offset-4 hover:text-larioja-amarillo hover:underline";

  return (
    <section className="relative overflow-hidden bg-larioja-azul text-white dark:bg-larioja-azul-profundo">
      {photo && (
        <Image src={photo} alt="" fill sizes="100vw" className="object-cover opacity-[0.22]" />
      )}
      <div className="relative mx-auto flex w-full max-w-[1080px] flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 md:py-24">
        <h2 className="m-0 max-w-[860px] font-montserrat text-[clamp(28px,4vw,50px)] font-extrabold leading-[1.12] text-balance">
          {textOr(closing.title, "Hoy puedes abrir la puerta a un oficio")}
          {highlight && <span className="text-larioja-amarillo"> {highlight}</span>}
        </h2>
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <TrackedLink href="#donar" event="donar" origin="cierre" className={`${BTN_YELLOW} min-h-[54px] rounded-full text-[17px]`}>
            {metaText(closing, "boton_1", "Quiero donar hoy")}
          </TrackedLink>
          <TrackedLink
            href={waLink(whatsapp, metaText(closing, "mensaje_whatsapp", "Hola, quiero saber cómo apoyar a La Rioja"))}
            event="contacto"
            origin="cierre"
            className={`${BTN_OUTLINE_WHITE} min-h-[54px] rounded-full text-[17px]`}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {metaText(closing, "boton_2", "Hablar con nosotros")}
          </TrackedLink>
        </div>
        {(phones || email || handle) && (
          <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 text-[15px] text-white/90">
            {[
              phones && <span key="tel">{phones}</span>,
              email && (
                <a key="mail" href={`mailto:${email}`} className={`${link} break-all`}>
                  {email}
                </a>
              ),
              handle && (
                <a key="ig" href={instagram} target="_blank" rel="noopener noreferrer" className={link}>
                  {handle}
                </a>
              ),
            ]
              .filter(Boolean)
              .flatMap((node, i) => (i === 0 ? [node] : [<span key={`sep-${i}`} aria-hidden="true">·</span>, node]))}
          </p>
        )}
      </div>
    </section>
  );
}
