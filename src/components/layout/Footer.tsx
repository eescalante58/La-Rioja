import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, MapPin } from "lucide-react";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { getSectionContent, getPageContent } from "@/services/cms";
import { ScrollReveal } from "./ScrollReveal";
import { ContactDescription } from "./ContactDescription";
import DynamicYear from "./DynamicYear";

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
