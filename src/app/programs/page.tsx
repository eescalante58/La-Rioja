import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import {
  Briefcase,
  Home,
  Users,
  BookOpen,
  Utensils,
  Palette,
  Heart,
  Smile,
  ArrowRight,
  CheckCircle2,
  Star,
  Target,
  Eye,
  Lightbulb,
  Award,
  GraduationCap,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Rocket,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProgramCTA } from "@/components/programs/ProgramCTA";
import { getPageContent } from "@/services/cms";

// Mapping of icon names to components for CMS
const IconMap: Record<string, any> = {
  Briefcase,
  Home,
  Users,
  BookOpen,
  Utensils,
  Palette,
  Heart,
  Smile,
  Target,
  Eye,
  Lightbulb,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Rocket,
  User,
  Star,
};

/**
 * Helper to render dynamic icons from CMS
 */
function DynamicIcon({
  name,
  className = "w-8 h-8",
  size = 28,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const IconComponent = IconMap[name] || Star; // Fallback to Star
  return <IconComponent className={className} size={size} />;
}

/**
 * Helper to split title and highlight the last word
 */
function HighlightedTitle({
  title,
  highlightColor = "text-larioja-amarillo",
}: {
  title: string;
  highlightColor?: string;
}) {
  if (!title) return null;
  const words = title.split(" ");
  if (words.length <= 1) return <span>{title}</span>;

  const lastWord = words.pop();
  const mainText = words.join(" ");

  return (
    <>
      {mainText} <span className={highlightColor}>{lastWord}</span>
    </>
  );
}

export const metadata: Metadata = {
  title: "Programas - La Rioja",
  description:
    "Descubre nuestros programas de formación laboral, talleres vocacionales y proyectos de inclusión diseñados para potenciar el talento de cada estudiante.",
};

/**
 * Programs page component.
 * Displays the different educational and vocational programs offered by La Rioja.
 */
export default async function ProgramsPage() {
  const [content, socialMedia] = await Promise.all([
    getPageContent("programs"),
    getPageContent("social media"),
  ]);

  const getSection = (key: string) =>
    content.find((s: any) => s.section_key === key);

  const getSocialLink = (key: string) => {
    if (!Array.isArray(socialMedia)) return "#";
    const link = socialMedia.find((l: any) => l.section_key === key);
    return link?.description ?? "#";
  };

  const whatsappLink = getSocialLink("whatsapp");

  const hero = getSection("programs_hero");
  const intro = getSection("programs_intro");
  const levels = getSection("programs_levels");
  const academic = getSection("academic_content");
  const workshops = getSection("workshops");
  const value = getSection("programs_value");
  const cta = getSection("programs_cta");

  const programs = Array.isArray(levels?.metadata) ? levels.metadata : [];
  const academicItems = Array.isArray(academic?.metadata)
    ? academic.metadata
    : [];
  const workshopItems = Array.isArray(workshops?.metadata)
    ? workshops.metadata
    : [];
  const valueProps = Array.isArray(value?.metadata) ? value.metadata : [];

  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />

        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/10 rounded-full blur-2xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/5 rounded-full blur-2xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo text-larioja-azul text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                {hero?.metadata?.badge || "Formación con Propósito"}
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-8 tracking-tight break-words [overflow-wrap:anywhere]">
                <HighlightedTitle title={hero?.title || "Nuestros Programas"} />
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                {hero?.description ||
                  "Modelos educativos innovadores y personalizados que transforman el potencial de nuestros estudiantes en habilidades reales para la vida y el trabajo."}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-larioja-azul dark:text-white leading-tight break-words [overflow-wrap:anywhere]">
                  <HighlightedTitle
                    title={
                      intro?.title ||
                      "Un enfoque integral para el desarrollo pleno"
                    }
                    highlightColor="text-larioja-verde"
                  />
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
                  {intro?.description ||
                    "En CFL La Rioja, entendemos que cada persona es única. Por ello, nuestros programas están diseñados para abordar todas las dimensiones del ser humano: técnica, social, emocional y académica."}
                </p>
                <div className="space-y-4">
                  {(Array.isArray(intro?.metadata?.checklist)
                    ? intro.metadata.checklist
                    : [
                        "Atención personalizada (grupos reducidos)",
                        "Metodología 100% práctica y funcional",
                        "Acompañamiento por profesionales especializados",
                        "Evaluación continua del progreso",
                      ]
                  ).map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-larioja-verde/20 rounded-full flex items-center justify-center text-larioja-verde">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-gray-700 dark:text-white/80 font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative">
                {intro?.metadata?.image_style === "circle" ? (
                  <div className="circle-effect-container">
                    <div className="circle-decoration-blob blob-verde animate-pulse" />
                    <div className="circle-decoration-blob blob-amarillo animate-pulse delay-700" />
                    <div
                      className={`circle-image-wrapper ${intro?.metadata?.image_animation === "popIn" ? "animate-pop-in" : ""}`}
                    >
                      <Image
                        src={
                          intro?.image_url ||
                          intro?.metadata?.image_url ||
                          "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        }
                        alt={intro?.title || "Estudiantes trabajando"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`aspect-video relative rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-slate-800 ${intro?.metadata?.image_animation === "popIn" ? "animate-pop-in" : ""}`}
                  >
                    <Image
                      src={
                        intro?.image_url ||
                        intro?.metadata?.image_url ||
                        "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                      }
                      alt={intro?.title || "Estudiantes trabajando"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="absolute -bottom-6 -left-6 bg-larioja-amarillo p-6 rounded-3xl shadow-xl hidden md:block z-20">
                  <Star className="text-larioja-azul w-8 h-8 mb-2" />
                  <p className="text-larioja-azul font-bold text-sm leading-tight">
                    Excelencia en
                    <br />
                    Educación Especial
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Programs Grid (Levels) */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          {(levels?.title || levels?.description) && (
            <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
              {levels.title && (
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white break-words [overflow-wrap:anywhere]">
                  <HighlightedTitle
                    title={levels.title}
                    highlightColor="text-larioja-verde"
                  />
                </h2>
              )}
              {levels.description && (
                <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
                  {levels.description}
                </p>
              )}
            </ScrollReveal>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
            {programs.map((program: any, idx: number) => (
              <ScrollReveal
                key={program.id || idx}
                delay={idx * 100}
                direction={idx % 2 === 0 ? "left" : "right"}
              >
                <div className="bg-gray-50 dark:bg-slate-900/30 rounded-3xl p-10 h-full border border-transparent hover:border-larioja-verde/20 transition-all duration-500 group flex flex-col hover:bg-white dark:hover:bg-slate-900 hover:shadow-md">
                  <div
                    className={`w-16 h-16 ${program.bg} rounded-2xl flex items-center justify-center ${program.color} mb-8 group-hover:scale-105 transition-transform`}
                  >
                    <DynamicIcon name={program.icon} size={32} />
                  </div>
                  <h3 className="text-3xl font-bold mb-6 text-larioja-azul dark:text-white">
                    {program.title}
                  </h3>
                  <p className="text-gray-500 dark:text-white/60 mb-8 leading-relaxed">
                    {program.description}
                  </p>

                  <div className="mt-auto">
                    <h4 className="text-sm font-black uppercase tracking-widest text-larioja-verde mb-4">
                      Módulos principales:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(Array.isArray(program.items) ? program.items : []).map(
                        (item: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-larioja-amarillo" />
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Content Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white">
              <HighlightedTitle
                title={academic?.title || "Contenido Académico"}
                highlightColor="text-larioja-verde"
              />
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
              {academic?.description ||
                "Nuestro programa incluye una formación académica integral diseñada para fortalecer las capacidades fundamentales de cada estudiante."}
            </p>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto space-y-8">
            {academicItems.map((item: any, idx: number) => (
              <ScrollReveal
                key={idx}
                delay={idx * 100}
                direction="up"
                className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 group hover:shadow-md transition-shadow"
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg ${item.color || "bg-larioja-azul"} ${item.textColor || "text-white"} group-hover:scale-110 transition-transform`}
                >
                  {item.number}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-larioja-azul dark:text-white mb-2 uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Workshops Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-larioja-verde/5 -skew-x-12 translate-x-1/2 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white">
              <HighlightedTitle
                title={workshops?.title || "Talleres Vocacionales"}
                highlightColor="text-larioja-verde"
              />
            </h2>
            <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
              {workshops?.description ||
                "Nuestros talleres proporcionan formación técnica especializada para fomentar la autonomía y la inserción laboral."}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-stretch">
            {workshopItems.map((workshop: any, idx: number) => (
              <ScrollReveal
                key={workshop.id || idx}
                delay={idx * 150}
                direction={idx % 2 === 0 ? "left" : "right"}
                className="group h-[450px] [perspective:1200px]"
              >
                <div className="relative h-full w-full rounded-3xl transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl border border-gray-100 dark:border-white/5">
                  {/* Front Side: Image with Badge */}
                  <div className="absolute inset-0 h-full w-full rounded-3xl [backface-visibility:hidden] overflow-hidden">
                    <Image
                      src={workshop.image_url}
                      alt={workshop.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-larioja-amarillo rounded-2xl flex items-center justify-center text-larioja-azul shadow-lg">
                          <DynamicIcon name={workshop.icon} size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                          {workshop.title}
                        </h3>
                      </div>
                      <p className="text-white/80 text-sm font-medium uppercase tracking-widest">
                        Toca para conocer más
                      </p>
                    </div>
                  </div>

                  {/* Back Side: Description and Icon */}
                  <div className="absolute inset-0 h-full w-full rounded-3xl bg-larioja-azul dark:bg-slate-900 p-10 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-larioja-amarillo/10 rounded-3xl flex items-center justify-center text-larioja-amarillo mb-8">
                      <DynamicIcon name={workshop.icon} size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-6 uppercase tracking-tight">
                      {workshop.title}
                    </h3>
                    <p className="text-lg text-white/70 leading-relaxed font-light">
                      {workshop.description}
                    </p>
                    <div className="mt-8 pt-8 border-t border-white/10 w-full">
                      <span className="text-larioja-amarillo font-bold uppercase tracking-widest text-xs">
                        Formación Técnica La Rioja
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Special Highlights Section */}
      <section className="py-24 bg-larioja-azul relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-16 text-white break-words [overflow-wrap:anywhere]">
              <HighlightedTitle
                title={value?.title || "Nuestra Propuesta de Valor"}
              />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {valueProps.map((item: any, idx: number) => (
                <div key={idx} className="space-y-4">
                  <div
                    className={`w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto ${item.color}`}
                  >
                    <DynamicIcon name={item.icon} size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-white/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <ProgramCTA
              title={cta?.title || "¿Quieres inscribir a tu hijo/a?"}
              description={
                cta?.description ||
                "Estamos aquí para guiarte en el proceso. Conoce los requisitos y agenda una visita para conocer nuestras instalaciones."
              }
              whatsappLink={whatsappLink}
            />
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
