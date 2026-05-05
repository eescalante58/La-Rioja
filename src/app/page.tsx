import Link from "next/link";
import { getSectionContent, getPageContent } from "@/services/cms";
import { Instagram, Facebook, Twitter, MapPin } from "lucide-react";
import { Metadata } from "next";

import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import DynamicYear from "@/components/layout/DynamicYear";

export const metadata: Metadata = {
  title: "La Rioja - Entidad de Formación Laboral",
  description:
    "Formando futuros, integrando vidas. Centro especializado en la formación laboral para personas con discapacidad intelectual.",
  openGraph: {
    title: "La Rioja",
    description:
      "Entidad de formación laboral para personas con discapacidad intelectual.",
    images: ["/logo.png"],
  },
};

/**
 * WhatsApp Icon component (Custom SVG for better fidelity)
 */
const WhatsAppIcon = ({ className = "w-7 h-7" }) => (
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
 * Main Home page component that consumes dynamic content from the CMS.
 * @returns {Promise<JSX.Element>} The rendered home page.
 */
export default async function Home() {
  // Fetch dynamic content from CMS using settled promises to avoid total failures
  const results = await Promise.allSettled([
    getSectionContent("home", "hero_main"),
    getSectionContent("home", "services_intro"),
    getPageContent("services"),
    getPageContent("social media"),
  ]);

  const heroContent =
    results[0].status === "fulfilled" ? results[0].value : null;
  const servicesIntro =
    results[1].status === "fulfilled" ? results[1].value : null;
  const servicesItems =
    results[2].status === "fulfilled" ? results[2].value : [];
  const socialLinks = results[3].status === "fulfilled" ? results[3].value : [];

  const getSocialLink = (key: string) => {
    if (!Array.isArray(socialLinks)) return "#";
    const link = socialLinks.find((l: any) => l.section_key === key);
    return link?.description ?? "#";
  };

  // Fallback services if CMS doesn't have them
  const displayServices =
    servicesItems.length > 0
      ? servicesItems.map((s: any) => ({ title: s.title, desc: s.description }))
      : [
          {
            title: "Formación Laboral",
            desc: "Capacitación técnica y habilidades para el empleo.",
          },
          {
            title: "Inclusión Social",
            desc: "Programas de integración y desarrollo personal.",
          },
          {
            title: "Bingo Benéfico",
            desc: "Eventos para recaudar fondos y apoyar nuestra misión.",
          },
        ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Logo (Top Left) */}
      <div className="fixed top-4 left-4 z-50 p-2 transition-colors">
        <div className="relative h-14 w-40 md:h-20 md:w-80">
          <Image
            src="/logo.png"
            alt="La Rioja Logo"
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 160px, (max-width: 1200px) 320px, 384px"
          />
        </div>
      </div>

      {/* Navigation (Top Right) */}
      <nav className="fixed top-4 right-4 z-50 flex items-center gap-4 p-2 transition-colors">
        <div className="flex items-center gap-3">
          <Link
            href="/about"
            className="text-white hover:text-larioja-amarillo font-bold text-sm transition-all"
          >
            Nosotros
          </Link>
          <Link
            href="/bingo"
            className="text-white hover:text-larioja-verde font-bold text-sm transition-all"
          >
            Bingo
          </Link>
          <Link
            href="/admin"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 font-bold py-1.5 px-6 rounded-full text-xs transition-all"
          >
            Panel de Control
          </Link>
          <div className="bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/30">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center text-white bg-larioja-azul overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-larioja-azul/20 z-10" />
        <div className="container mx-auto px-6 relative z-20 text-center max-w-5xl">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 animate-fade-in tracking-tight">
            {heroContent?.title || "Bienvenidos a La Rioja"}
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90">
            {heroContent?.description ||
              "Entidad de formación laboral para personas con discapacidad intelectual."}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/bingo"
              className="bg-larioja-amarillo hover:bg-yellow-400 text-larioja-azul font-bold py-3 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-larioja-amarillo/20"
            >
              Jugar Bingo
            </Link>
          </div>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-larioja-verde/20 rounded-full blur-3xl z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-4">
              {servicesIntro?.title || "Nuestros Servicios"}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {servicesIntro?.description ||
                "Ofrecemos programas de formación adaptados para potenciar las habilidades de nuestros participantes."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayServices.map((service, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media & Footer */}
      <footer className="bg-larioja-azul dark:bg-gray-950 text-white py-12 transition-colors">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">La Rioja</h3>
              <p className="opacity-70 mb-4">
                Formando futuros, integrando vidas.
              </p>
              <a
                href={getSocialLink("google maps")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-sm hover:text-larioja-amarillo transition-colors group"
              >
                <MapPin
                  size={18}
                  className="text-larioja-amarillo group-hover:scale-110 transition-transform"
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
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center opacity-50 text-sm">
            <span>
              &copy; <DynamicYear /> La Rioja. Todos los derechos reservados.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

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
