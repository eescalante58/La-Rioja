import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { getPageContent } from "@/services/cms";
import {
  Target,
  Eye,
  Heart,
  Lightbulb,
  Users,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Rocket,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DynamicYear from "@/components/layout/DynamicYear";

// Mapping of icon names to components for CMS
const IconMap: Record<string, any> = {
  Target,
  Eye,
  Heart,
  Lightbulb,
  Users,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Rocket,
  User,
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
  title: "Nosotros - La Rioja",
  description:
    "Conoce nuestra historia, misión, visión y el equipo profesional que hace posible la formación laboral de calidad en El Salvador.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await getPageContent("about");

  const getSection = (key: string) =>
    content.find((s) => s.section_key === key);

  const hero = getSection("about_hero");
  const mission = getSection("about_mission");
  const vision = getSection("about_vision");
  const values = getSection("about_values");
  const structure = getSection("about_structure");
  const timeline = getSection("about_timeline");
  const stats = getSection("about_stats");
  const team = getSection("about_team");
  const cta = getSection("about_cta");

  // Helper to extract style from array metadata
  const getStyleFromMetadata = (metadata: any) => {
    if (!Array.isArray(metadata)) return metadata || {};
    return (
      metadata.find(
        (item: any) =>
          item.desc_font_size ||
          item.title_font_size ||
          item.desc_font_color ||
          item.title_font_color,
      ) || {}
    );
  };

  const valuesStyle = getStyleFromMetadata(values?.metadata);
  const valuesItems = Array.isArray(values?.metadata)
    ? values.metadata.filter((item: any) => item.title)
    : [];

  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden font-montserrat">
      <Navbar />

      {/* Hero Section - Nuestra Historia */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />

        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/20 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo/20 text-larioja-amarillo text-xs font-bold uppercase tracking-widest mb-4">
                {hero?.metadata?.badge || "Trayectoria y Compromiso"}
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                <HighlightedTitle title={hero?.title || "Nuestra Historia"} />
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                {hero?.description ||
                  "Desde 2009, CFL La Rioja ha sido pionera en educación especializada para personas con discapacidad intelectual en El Salvador, transformando vidas a través de formación laboral de calidad."}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div className="bg-white dark:bg-larioja-azul rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-white/5 overflow-hidden group h-full flex flex-col">
                {mission?.image_url && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={mission.image_url}
                      alt={mission.title || "Nuestra Misión"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-larioja-azul/20 to-transparent" />
                  </div>
                )}
                <div className="p-10 relative flex-1 flex flex-col">
                  <div className="absolute top-0 right-0 p-8 text-larioja-azul/5 dark:text-white/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <Target size={120} />
                  </div>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-larioja-azul dark:text-larioja-amarillo mb-8">
                    <Target size={32} />
                  </div>
                  <h2
                    className={`font-bold mb-6 ${mission?.metadata?.title_font_size || "text-3xl"} ${mission?.metadata?.title_font_color || "text-larioja-azul dark:text-white"}`}
                  >
                    {mission?.title || "Nuestra Misión"}
                  </h2>
                  <p
                    className={`leading-relaxed ${mission?.metadata?.desc_font_size || "text-lg"} ${mission?.metadata?.desc_font_color || "text-gray-600 dark:text-white/70"}`}
                  >
                    {mission?.description ||
                      "Proporcionar formación laboral especializada y de calidad a personas con discapacidad intelectual, desarrollando sus habilidades prácticas, autonomía e integración social para mejorar su calidad de vida y contribuir a su inclusión en la comunidad."}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="bg-white dark:bg-larioja-azul rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-white/5 overflow-hidden group h-full flex flex-col">
                {vision?.image_url && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={vision.image_url}
                      alt={vision.title || "Nuestra Visión"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-larioja-verde/10 to-transparent" />
                  </div>
                )}
                <div className="p-10 relative flex-1 flex flex-col">
                  <div className="absolute top-0 right-0 p-8 text-larioja-verde/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    <Eye size={120} />
                  </div>
                  <div className="w-16 h-16 bg-green-100 dark:bg-larioja-verde/20 rounded-2xl flex items-center justify-center text-larioja-verde mb-8">
                    <Eye size={32} />
                  </div>
                  <h2
                    className={`font-bold mb-6 ${vision?.metadata?.title_font_size || "text-3xl"} ${vision?.metadata?.title_font_color || "text-larioja-azul dark:text-white"}`}
                  >
                    {vision?.title || "Nuestra Visión"}
                  </h2>
                  <p
                    className={`leading-relaxed ${vision?.metadata?.desc_font_size || "text-lg"} ${vision?.metadata?.desc_font_color || "text-gray-600 dark:text-white/70"}`}
                  >
                    {vision?.description ||
                      "Ser el centro de referencia en educación especializada e inclusión laboral, reconocido por la excelencia de nuestros programas y el éxito de nuestros egresados en el mercado laboral y en la vida cotidiana."}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2
                className={`font-bold mb-6 tracking-tight ${valuesStyle?.title_font_size || "text-4xl md:text-5xl"} ${valuesStyle?.title_font_color || "text-larioja-azul dark:text-white"}`}
              >
                <HighlightedTitle
                  title={values?.title || "Nuestros Valores"}
                  highlightColor="text-larioja-verde"
                />
              </h2>
              <p
                className={`text-gray-500 dark:text-white/60 ${valuesStyle?.desc_font_size || "text-lg"} ${valuesStyle?.desc_font_color || ""}`}
              >
                {values?.description ||
                  "Principios que guían todas nuestras acciones y decisiones para brindar el mejor acompañamiento a nuestros estudiantes."}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {valuesItems.map((value: any, idx: number) => (
              <ScrollReveal key={value.title} delay={idx * 100}>
                <div className="bg-gray-50 dark:bg-slate-900/30 p-8 rounded-3xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 group h-full">
                  <div
                    className={`w-14 h-14 ${value.bg} rounded-2xl flex items-center justify-center ${value.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <DynamicIcon name={value.icon} size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-larioja-azul dark:text-white">
                    {value.title}
                  </h3>
                  <p className="text-gray-500 dark:text-white/60 leading-relaxed text-sm">
                    {value.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Organizational Structure Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
                <HighlightedTitle
                  title={structure?.title || "Estructura Organizativa"}
                  highlightColor="text-larioja-verde"
                />
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/60">
                {structure?.description ||
                  "Nuestra organización se basa en la colaboración y el compromiso de cada uno de sus miembros para cumplir nuestra misión."}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="max-w-5xl mx-auto bg-white dark:bg-larioja-azul p-4 md:p-8 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-gray-100 dark:border-white/5 overflow-hidden">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={
                    structure?.image_url ||
                    "https://images.unsplash.com/photo-1517245318773-b7b71a1639d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={structure?.title || "Estructura Organizativa"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-larioja-azul dark:text-white tracking-tight">
                  <HighlightedTitle
                    title={timeline?.title || "Nuestro Recorrido"}
                  />
                </h2>
                <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10 before:h-full pb-4">
                  {(Array.isArray(timeline?.metadata?.items)
                    ? timeline.metadata.items
                    : []
                  ).map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-10 group">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-larioja-azul border-4 border-larioja-azul dark:border-larioja-amarillo group-hover:scale-125 transition-transform duration-300 z-10" />
                      <span className="text-xs font-bold text-larioja-verde mb-1 block uppercase tracking-wider">
                        {item.year}
                      </span>
                      <p className="text-lg font-medium text-larioja-azul dark:text-white/90">
                        {item.event}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative group">
                <div className="aspect-video relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 transition-transform duration-500 group-hover:scale-[1.02] bg-gray-50 dark:bg-slate-900">
                  <Image
                    src={
                      timeline?.image_url ||
                      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }
                    alt={timeline?.title || "Nuestro Recorrido"}
                    fill
                    className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-larioja-azul/10 via-transparent to-transparent pointer-events-none z-10" />
                </div>
                {/* Decorative floating badge */}
                <div className="absolute -bottom-6 -right-4 bg-white dark:bg-larioja-azul p-5 md:p-6 rounded-3xl shadow-2xl z-20 border border-gray-100 dark:border-white/5 animate-bounce-slow">
                  <div className="text-center">
                    <span className="text-3xl md:text-4xl font-black text-larioja-azul dark:text-larioja-amarillo block">
                      {timeline?.metadata?.badge_value || "16+"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {timeline?.metadata?.badge_text || "Años de Historia"}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-7xl mx-auto">
            {(Array.isArray(stats?.metadata) ? stats.metadata : []).map(
              (stat: any, idx: number) => (
                <ScrollReveal key={stat.label} delay={idx * 50}>
                  <div className="text-center group">
                    <div
                      className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <DynamicIcon name={stat.icon} size={32} />
                    </div>
                    <div className="text-3xl font-black text-larioja-azul dark:text-white mb-1">
                      {stat.val}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {stat.label}
                    </div>
                  </div>
                </ScrollReveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
                <HighlightedTitle
                  title={team?.title || "Nuestro Equipo Profesional"}
                  highlightColor="text-larioja-verde"
                />
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/60">
                {team?.description ||
                  "20 profesionales apasionados y dedicados a la excelencia educativa y el desarrollo integral."}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {(Array.isArray(team?.metadata) ? team.metadata : []).map(
              (member: any, idx: number) => (
                <ScrollReveal key={member.role} delay={idx * 100}>
                  <div className="bg-white dark:bg-larioja-azul p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl shadow-blue-900/5 hover:-translate-y-2 transition-all duration-300 group text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-400 overflow-hidden relative border-4 border-gray-50 dark:border-slate-800">
                      <User size={48} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-larioja-azul dark:text-white">
                      {member.role}
                    </h3>
                    <Badge className="mb-4 bg-larioja-verde/10 text-larioja-verde border-none">
                      {member.spec}
                    </Badge>
                    <p className="text-gray-500 dark:text-white/60 text-sm">
                      {member.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="bg-larioja-verde p-12 md:p-20 rounded-[3rem] relative overflow-hidden text-center max-w-5xl mx-auto">
              {/* Background patterns */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-larioja-azul/10 rounded-full -ml-20 -mb-20 blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight">
                  {cta?.title || "¿Listo para ser parte de nuestra comunidad?"}
                </h2>
                <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  {cta?.description ||
                    "Conoce nuestros programas vocacionales y descubre cómo podemos apoyar el desarrollo integral de tus seres queridos."}
                </p>
                <Link
                  href={cta?.metadata?.button_link || "/bingo"}
                  className="inline-flex items-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl text-lg group"
                >
                  {cta?.metadata?.button_text || "Ver Programas"}
                  <Rocket
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}
