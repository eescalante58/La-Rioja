import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, MapPin } from "lucide-react";
import { getSectionContent, getPageContent } from "@/services/cms";
import { ScrollReveal } from "./ScrollReveal";
import { ContactDescription } from "./ContactDescription";
import DynamicYear from "./DynamicYear";

/**
 * WhatsApp Icon component (Custom SVG for better fidelity)
 */
const WhatsAppIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Reusable Social Icon Link Component
 */
function SocialIcon({
  href,
  children,
  label,
  colorClass = "hover:text-larioja-amarillo",
}: {
  href: string;
  children: React.ReactNode;
  label: string;
  colorClass?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`${colorClass} transition-colors`}
    >
      {children}
    </a>
  );
}

/**
 * Reusable Footer component that fetches its own data from CMS
 */
export async function Footer() {
  const results = await Promise.allSettled([
    getSectionContent("home", "contact_card"),
    getPageContent("social media"),
  ]);

  const contactCard =
    results[0].status === "fulfilled" ? results[0].value : null;
  const socialLinks = results[1].status === "fulfilled" ? results[1].value : [];

  const getSocialLink = (key: string) => {
    if (!Array.isArray(socialLinks)) return "#";
    const link = socialLinks.find((l: any) => l.section_key === key);
    return link?.description ?? "#";
  };

  return (
    <footer className="bg-larioja-azul dark:bg-gray-950 text-white py-16 transition-colors relative z-30 border-t border-white/5">
      <div className="container mx-auto px-6">
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2 font-montserrat">
              La Rioja
            </h3>
            <p className="opacity-70 mb-4">
              Formando futuros, integrando vidas.
            </p>
            <div className="flex flex-col gap-2 mb-6 font-montserrat">
              <Link
                href="/"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Inicio
              </Link>
              <Link
                href="/about"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Nosotros
              </Link>
              <Link
                href="/contact"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Apóyanos
              </Link>
              <Link
                href="/programs"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Programas
              </Link>
              <Link
                href="/faq"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Preguntas Frecuentes
              </Link>
              <Link
                href="/bingo"
                className="text-sm opacity-70 hover:opacity-100 hover:text-larioja-amarillo transition-all"
              >
                Bingo
              </Link>
            </div>

            {contactCard && contactCard.is_active && (
              <div className="mb-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 max-w-sm mx-auto md:mx-0">
                <h4 className="text-larioja-amarillo font-bold mb-2">
                  {contactCard.title}
                </h4>
                <ContactDescription description={contactCard.description} />
                {contactCard.image_url && (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4">
                    <Image
                      src={contactCard.image_url}
                      alt={contactCard.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <a
              href={getSocialLink("google maps")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center md:justify-start gap-2 text-sm hover:text-larioja-amarillo transition-colors group"
            >
              <MapPin
                size={18}
                className="text-larioja-amarillo group-hover:scale-105 transition-transform"
              />
              <span>Encuéntranos en Google Maps</span>
            </a>
          </div>

          <div className="flex gap-6">
            <SocialIcon href={getSocialLink("instagram")} label="Instagram">
              <Instagram size={28} />
            </SocialIcon>
            <SocialIcon href={getSocialLink("facebook")} label="Facebook">
              <Facebook size={28} />
            </SocialIcon>
            <SocialIcon href={getSocialLink("x")} label="X (Twitter)">
              <Twitter size={28} />
            </SocialIcon>
            <SocialIcon
              href={getSocialLink("whatsapp")}
              label="WhatsApp"
              colorClass="hover:text-larioja-verde"
            >
              <WhatsAppIcon className="w-7 h-7" />
            </SocialIcon>
          </div>
        </ScrollReveal>
        <div className="mt-12 pt-8 border-t border-white/10 text-center opacity-50 text-sm">
          <span>
            &copy; <DynamicYear /> La Rioja. Todos los derechos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
}
