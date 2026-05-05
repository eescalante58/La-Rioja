import Link from "next/link";
import { getSectionContent, getPageContent } from "@/services/cms";
import { Instagram, Facebook, Twitter, MapPin } from "lucide-react";
import { Metadata } from "next";

import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import DynamicYear from "@/components/layout/DynamicYear";

/**
 * Metadata configuration for SEO and Social Media sharing.
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
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
 * Interface for CMS Service Items
 */
interface ServiceItem {
  title: string;
  description: string;
}

/**
 * WhatsApp Icon component (Custom SVG for better fidelity).
 * @param {Object} props - Component props.
 * @param {string} [props.className] - Tailwind CSS classes.
 */
const WhatsAppIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/**
 * Main Home page component (Server Component).
 * Fetches CMS content and renders the landing page for La Rioja.
 *
 * WCAG 2.2 AA Compliant:
 * - Proper heading hierarchy.
 * - ARIA labels for interactive elements.
 * - High contrast focus states.
 *
 * @returns {Promise<JSX.Element>} The rendered Home component.
 */
export default async function Home() {
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

  const getSocialLink = (key: string): string => {
    if (!Array.isArray(socialLinks)) return "#";
    const link = socialLinks.find((l: any) => l.section_key === key);
    return link?.description ?? "#";
  };

  const displayServices: ServiceItem[] =
    servicesItems.length > 0
      ? servicesItems.map((s: any) => ({
          title: s.title,
          description: s.description,
        }))
      : [
          {
            title: "Formación Laboral",
            description: "Capacitación técnica y habilidades para el empleo.",
          },
          {
            title: "Inclusión Social",
            description: "Programas de integración y desarrollo personal.",
          },
          {
            title: "Bingo Benéfico",
            description:
              "Eventos para recaudar fondos y apoyar nuestra misión.",
          },
        ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Skip to Content Link - Vital for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-larioja-amarillo p-4 z-[100] rounded-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header / Logo */}
      <header className="fixed top-4 left-4 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 rounded-xl border border-white/20 dark:border-gray-800 shadow-sm transition-colors">
        <div className="relative h-14 w-40 md:h-24 md:w-96">
          <Image
            src="/logo.png"
            alt="Logotipo de La Rioja - Entidad de Formación Laboral"
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 160px, (max-width: 1200px) 320px, 384px"
          />
        </div>
      </header>

      {/* Navigation */}
      <nav
        aria-label="Navegación principal"
        className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/20 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/about"
            className="bg-larioja-amarillo hover:bg-yellow-400 text-larioja-azul font-bold py-1.5 px-4 rounded-full text-xs transition-all focus:ring-4 focus:ring-yellow-200 outline-none"
          >
            Nosotros
          </Link>
          <Link
            href="/bingo"
            className="bg-larioja-verde hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-full text-xs transition-all focus:ring-4 focus:ring-green-200 outline-none"
          >
            Bingo
          </Link>
          <Link
            href="/admin"
            className="bg-larioja-azul hover:bg-blue-900 text-white font-bold py-1.5 px-4 rounded-full text-xs transition-all focus:ring-4 focus:ring-blue-200 outline-none"
          >
            Panel de Control
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="main-content"
        aria-labelledby="hero-title"
        className="relative h-[80vh] flex items-center justify-center text-white bg-larioja-azul dark:bg-larioja-azul/40 overflow-hidden before:absolute before:inset-0 before:bg-larioja-azul/60 dark:before:bg-gray-900/80 before:z-10"
      >
        <div className="container mx-auto px-6 relative z-20 text-center">
          <h1
            id="hero-title"
            className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in drop-shadow-lg"
          >
            {heroContent?.title || "Bienvenidos a La Rioja"}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 drop-shadow-md">
            {heroContent?.description ||
              "Entidad de formación laboral para personas con discapacidad intelectual."}
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section
        className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors"
        aria-labelledby="services-title"
      >
        <div className="container mx-auto px-6">
          <header className="text-center mb-16">
            <h2
              id="services-title"
              className="text-4xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-4"
            >
              {servicesIntro?.title || "Nuestros Servicios"}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {servicesIntro?.description ||
                "Ofrecemos programas de formación adaptados para potenciar las habilidades."}
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-8">
            {displayServices.map((service, i) => (
              <article
                key={i}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all focus-within:ring-2 focus-within:ring-larioja-azul"
              >
                <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-larioja-azul dark:bg-gray-950 text-white py-12 transition-colors">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">La Rioja</h2>
              <p className="opacity-70 mb-4">
                Formando futuros, integrando vidas.
              </p>
              <a
                href={getSocialLink("google maps")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 text-sm hover:text-larioja-amarillo focus:ring-2 focus:ring-larioja-amarillo outline-none rounded-md p-1 transition-colors group"
                aria-label="Encuéntranos en Google Maps (abre en nueva pestaña)"
              >
                <MapPin
                  size={18}
                  aria-hidden="true"
                  className="text-larioja-amarillo group-hover:scale-110 transition-transform"
                />
                <span>Encuéntranos en Google Maps</span>
              </a>
            </div>

            <nav aria-label="Redes sociales" className="flex gap-6">
              <SocialIcon
                href={getSocialLink("instagram")}
                label="Instagram"
                icon={<Instagram size={28} />}
              />
              <SocialIcon
                href={getSocialLink("facebook")}
                label="Facebook"
                icon={<Facebook size={28} />}
              />
              <SocialIcon
                href={getSocialLink("x")}
                label="X (Twitter)"
                icon={<Twitter size={28} />}
              />
              <SocialIcon
                href={getSocialLink("whatsapp")}
                label="WhatsApp"
                colorClass="hover:text-larioja-verde"
                icon={<WhatsAppIcon className="w-7 h-7" />}
              />
            </nav>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center opacity-50 text-sm">
            <p>
              &copy; <DynamicYear /> La Rioja. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/**
 * Reusable Social Icon Link Component
 * @param {Object} props - Component props
 * @param {string} props.href - Destination URL
 * @param {string} props.label - ARIA label for accessibility
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} [props.colorClass] - Hover color class
 */
function SocialIcon({
  href,
  label,
  icon,
  colorClass = "hover:text-larioja-amarillo",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (abre en nueva pestaña)`}
      className={`${colorClass} transition-colors focus:ring-2 focus:ring-white outline-none rounded-full p-1`}
    >
      {icon}
    </a>
  );
}
