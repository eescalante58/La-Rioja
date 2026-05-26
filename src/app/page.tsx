import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getSectionContent, getPageContent } from "@/services/cms";
import {
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
import { Footer } from "@/components/layout/Footer";
import DynamicYear from "@/components/layout/DynamicYear";
import { ParallaxHero } from "@/components/layout/ParallaxHero";
import { ScrollReveal } from "@/components/layout/ScrollReveal";

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
  ]);

  const heroContent =
    results[0].status === "fulfilled" ? results[0].value : null;
  const servicesIntro =
    results[1].status === "fulfilled" ? results[1].value : null;
  const servicesItems =
    results[2].status === "fulfilled" ? results[2].value : [];

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
      <ParallaxHero heroContent={heroContent} />
      <section className="py-24 bg-gray-50 dark:bg-gray-900 transition-colors relative z-30">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-4 break-words [overflow-wrap:anywhere]">
              {servicesIntro?.title || "Nuestros Servicios"}
            </h2>
            {servicesIntro?.image_url && (
              <div className="relative w-full max-w-4xl mx-auto h-64 md:h-96 mb-10 rounded-2xl overflow-hidden shadow-lg group">
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
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-8 items-stretch">
            {displayServices.map((service: any, i: number) => {
              const isFlip = service.metadata?.variant === "flip";

              if (isFlip) {
                return (
                  <ScrollReveal
                    key={service.id || i}
                    delay={i * 100}
                    className="h-[450px] [perspective:1000px] w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[400px] flex-grow-0 flex-shrink-0"
                  >
                    <div className="group relative h-full w-full rounded-2xl transition-all duration-700 [transform-style:preserve-3d] hover:[transform:rotateY(180deg)] shadow-lg hover:shadow-xl">
                      {/* Front Side */}
                      <div className="absolute inset-0 h-full w-full rounded-2xl bg-white dark:bg-gray-800 [backface-visibility:hidden] overflow-hidden flex flex-col">
                        {service.image_url ? (
                          <div className="relative h-48 w-full">
                            <Image
                              src={service.image_url}
                              alt={service.title}
                              fill
                              className="object-contain bg-gray-50 dark:bg-gray-900/50"
                            />
                          </div>
                        ) : (
                          <div className="h-48 w-full bg-larioja-azul/5 flex items-center justify-center">
                            <DynamicIcon
                              name={service.metadata?.icon}
                              className="w-12 h-12 text-larioja-azul/20"
                            />
                          </div>
                        )}
                        <div className="p-6 text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-2">
                            {service.title}
                          </h3>
                          <p className="text-xs uppercase font-bold text-larioja-verde">
                            Toca para más info
                          </p>
                        </div>
                      </div>

                      {/* Back Side */}
                      <div className="absolute inset-0 h-full w-full rounded-2xl bg-larioja-azul dark:bg-larioja-amarillo p-8 text-white dark:text-larioja-azul [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center">
                        <h3 className="text-2xl font-bold mb-4">
                          {service.title}
                        </h3>
                        <p className="text-sm opacity-90 leading-relaxed mb-8">
                          {service.description || service.desc}
                        </p>
                        {service.metadata?.link && (
                          <Link
                            href={service.metadata.link}
                            className="bg-white dark:bg-larioja-azul text-larioja-azul dark:text-white px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-transform shadow-lg font-montserrat"
                          >
                            {service.metadata?.buttonText || "SABER MÁS"}
                          </Link>
                        )}
                      </div>
                    </div>
                  </ScrollReveal>
                );
              }

              return (
                <ScrollReveal
                  key={service.id || i}
                  delay={i * 100}
                  className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-[400px] flex-grow-0 flex-shrink-0"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden group h-full">
                    {service.image_url && (
                      <div className="relative h-52 w-full overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                        <Image
                          src={service.image_url}
                          alt={service.title}
                          fill
                          className="object-contain transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="w-14 h-14 bg-larioja-azul/10 dark:bg-larioja-amarillo/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-larioja-azul dark:group-hover:bg-larioja-amarillo transition-colors duration-300">
                        <DynamicIcon
                          name={service.metadata?.icon}
                          className="w-7 h-7 text-larioja-azul dark:text-larioja-amarillo group-hover:text-white dark:group-hover:text-larioja-azul transition-colors duration-300"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-3">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                        {service.description || service.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
