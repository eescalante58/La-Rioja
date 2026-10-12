import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, MapPin } from "lucide-react";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { getSectionContent, getPageContent } from "@/services/cms";
import { ScrollReveal } from "./ScrollReveal";
import { ContactDescription } from "./ContactDescription";
import type { SiteContent } from "@/types/cms";

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
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center ${colorClass} transition-colors`}
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

  const contactCard = results[0].status === "fulfilled" ? results[0].value : null;
  const socialLinks = results[1].status === "fulfilled" ? results[1].value : [];

  const getSocialLink = (key: string) => {
    if (!Array.isArray(socialLinks)) return "#";
    const link = socialLinks.find((l: SiteContent) => l.section_key === key);
    return link?.description ?? "#";
  };

  return (
    <footer className="bg-larioja-azul dark:bg-gray-950 text-white py-16 transition-colors relative z-30 border-t border-white/5">
      <div className="container mx-auto px-6">
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2 font-montserrat">La Rioja</h3>
            <p className="opacity-70 mb-4">Formando futuros, integrando vidas.</p>
            <nav className="mb-6 font-montserrat" aria-label="Navegación del pie de página">
              {[
                { href: "/", label: "Inicio" },
                { href: "/about", label: "Nosotros" },
                { href: "/apoyanos", label: "Apóyanos" },
                { href: "/programs", label: "Programas" },
                { href: "/faq", label: "Preguntas Frecuentes" },
                { href: "/bingo", label: "Bingo" },
                { href: "/productos", label: "La Rioja Shop" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-[44px] items-center text-sm opacity-70 transition-all hover:opacity-100 hover:text-larioja-amarillo"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {contactCard && contactCard.is_active && (
              <div className="mb-8 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 max-w-sm mx-auto md:mx-0">
                <h4 className="text-larioja-amarillo font-bold mb-2">{contactCard.title}</h4>
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
              className="flex min-h-[44px] items-center justify-center gap-2 text-sm transition-colors hover:text-larioja-amarillo group md:justify-start"
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
          <span>&copy; {new Date().getFullYear()} La Rioja. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
