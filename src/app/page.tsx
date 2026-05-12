import Link from "next/link";
import Image from "next/image";
import { getSectionContent, getPageContent } from "@/services/cms";
import {
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Briefcase,
  Users,
  Ticket,
  GraduationCap,
  Heart,
  Sun,
  BookOpen,
  Award,
  Zap,
} from "lucide-react";
import { Metadata } from "next";

import { Navbar } from "@/components/layout/Navbar";
import DynamicYear from "@/components/layout/DynamicYear";

// Mapping of icon names to components
const IconMap: Record<string, any> = {
  Briefcase: Briefcase,
  Users: Users,
  Ticket: Ticket,
  GraduationCap: GraduationCap,
  Heart: Heart,
  Sun: Sun,
  BookOpen: BookOpen,
  Award: Award,
  Zap: Zap,
};

/**
 * Helper to render dynamic icons from CMS
 */
function DynamicIcon({
  name,
  className = "w-8 h-8",
}: {
  name: string;
  className?: string;
}) {
  const IconComponent = IconMap[name] || Briefcase; // Fallback to Briefcase
  return <IconComponent className={className} />;
}

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
      ? servicesItems
      : [
          {
            title: "Formación Laboral",
            description: "Capacitación técnica y habilidades para el empleo.",
            metadata: { icon: "Briefcase" },
          },
          {
            title: "Inclusión Social",
            description: "Programas de integración y desarrollo personal.",
            metadata: { icon: "Users" },
          },
          {
            title: "Bingo Benéfico",
            description:
              "Eventos para recaudar fondos y apoyar nuestra misión.",
            metadata: { icon: "Ticket" },
          },
        ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white bg-larioja-azul overflow-hidden pt-32 pb-20 md:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-larioja-azul/20 z-10" />
        <div className="container mx-auto px-4 sm:px-6 relative z-20 text-center max-w-5xl mt-12 md:mt-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 animate-fade-in tracking-tight leading-[1.1] drop-shadow-sm text-[#FFFF00]">
            {heroContent?.title || "Bienvenidos a La Rioja"}
          </h1>

          {heroContent?.image_url && (
            <div className="relative w-full max-w-2xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 mb-8 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
              <Image
                src={heroContent.image_url}
                alt={heroContent.title || "Hero Image"}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-10 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90 px-4">
            {heroContent?.description ||
              "Entidad de formación laboral para personas con discapacidad intelectual."}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/bingo"
              className="bg-larioja-amarillo hover:bg-yellow-400 text-larioja-azul font-bold py-2.5 px-6 sm:py-3 sm:px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-larioja-amarillo/20 text-sm sm:text-base"
            >
              Jugar Bingo
            </Link>
          </div>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute -bottom-12 -left-12 sm:-bottom-24 sm:-left-24 w-48 h-48 sm:w-96 sm:h-96 bg-larioja-verde/20 rounded-full blur-2xl sm:blur-3xl z-0" />
        <div className="absolute -top-12 -right-12 sm:-top-24 sm:-right-24 w-48 h-48 sm:w-96 sm:h-96 bg-larioja-amarillo/10 rounded-full blur-2xl sm:blur-3xl z-0" />
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-4">
              {servicesIntro?.title || "Nuestros Servicios"}
            </h2>
            {servicesIntro?.image_url && (
              <div className="relative w-full max-w-3xl mx-auto h-64 md:h-96 mb-10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in group">
                <Image
                  src={servicesIntro.image_url}
                  alt={servicesIntro.title || "Nuestros Servicios"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {servicesIntro?.description ||
                "Ofrecemos programas de formación adaptados para potenciar las habilidades de nuestros participantes."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayServices.map((service: any, i: number) => {
              const isFlip = service.metadata?.variant === "flip";

              if (isFlip) {
                return (
                  <div
                    key={service.id || i}
                    className="group h-[350px] [perspective:1000px]"
                  >
                    <div className="relative h-full w-full rounded-3xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-lg">
                      {/* Front Side */}
                      <div className="absolute inset-0 h-full w-full rounded-3xl bg-white dark:bg-gray-800 p-8 [backface-visibility:hidden] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-larioja-azul/10 dark:bg-larioja-amarillo/10 rounded-2xl flex items-center justify-center mb-6">
                          <DynamicIcon
                            name={service.metadata?.icon}
                            className="w-8 h-8 text-larioja-azul dark:text-larioja-amarillo"
                          />
                        </div>
                        <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-3">
                          {service.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Pasa el cursor para saber más
                        </p>
                      </div>

                      {/* Back Side */}
                      <div className="absolute inset-0 h-full w-full rounded-3xl bg-larioja-azul dark:bg-larioja-amarillo p-8 text-white dark:text-larioja-azul [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center">
                        <h3 className="text-xl font-bold mb-4">
                          {service.title}
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed mb-6">
                          {service.description || service.desc}
                        </p>
                        {service.metadata?.link && (
                          <Link
                            href={service.metadata.link}
                            className="bg-white dark:bg-larioja-azul text-larioja-azul dark:text-white px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                          >
                            {service.metadata?.buttonText || "Saber más"}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={service.id || i}
                  className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 bg-larioja-azul/10 dark:bg-larioja-amarillo/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-larioja-azul dark:group-hover:bg-larioja-amarillo transition-colors duration-300">
                    <DynamicIcon
                      name={service.metadata?.icon}
                      className="w-8 h-8 text-larioja-azul dark:text-larioja-amarillo group-hover:text-white dark:group-hover:text-larioja-azul transition-colors duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {service.description || service.desc}
                  </p>
                </div>
              );
            })}
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
              <div className="flex flex-col gap-2 mb-6">
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
