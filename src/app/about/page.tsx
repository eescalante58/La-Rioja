import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
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

export const metadata: Metadata = {
  title: "Nosotros - La Rioja",
  description:
    "Conoce nuestra historia, misión, visión y el equipo profesional que hace posible la formación laboral de calidad en El Salvador.",
};

export default function AboutPage() {
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
                Trayectoria y Compromiso
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                Nuestra <span className="text-larioja-amarillo">Historia</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                Desde 2009, CFL La Rioja ha sido pionera en educación
                especializada para personas con discapacidad intelectual en El
                Salvador, transformando vidas a través de formación laboral de
                calidad.
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
              <div className="bg-white dark:bg-larioja-azul p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-larioja-azul/5 dark:text-white/5 group-hover:scale-110 transition-transform duration-500">
                  <Target size={120} />
                </div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-larioja-azul dark:text-larioja-amarillo mb-8">
                  <Target size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-6 text-larioja-azul dark:text-white">
                  Nuestra Misión
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
                  Proporcionar formación laboral especializada y de calidad a
                  personas con discapacidad intelectual, desarrollando sus
                  habilidades prácticas, autonomía e integración social para
                  mejorar su calidad de vida y contribuir a su inclusión en la
                  comunidad.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="bg-white dark:bg-larioja-azul p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-larioja-verde/5 group-hover:scale-110 transition-transform duration-500">
                  <Eye size={120} />
                </div>
                <div className="w-16 h-16 bg-green-100 dark:bg-larioja-verde/20 rounded-2xl flex items-center justify-center text-larioja-verde mb-8">
                  <Eye size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-6 text-larioja-azul dark:text-white">
                  Nuestra Visión
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
                  Ser el centro de referencia en educación especializada e
                  inclusión laboral, reconocido por la excelencia de nuestros
                  programas y el éxito de nuestros egresados en el mercado
                  laboral y en la vida cotidiana.
                </p>
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
                Nuestros <span className="text-larioja-verde">Valores</span>
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/60">
                Principios que guían todas nuestras acciones y decisiones para
                brindar el mejor acompañamiento a nuestros estudiantes.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                title: "Compromiso",
                desc: "Dedicación total al desarrollo integral de nuestros estudiantes.",
                icon: Heart,
                color: "text-rose-500",
                bg: "bg-rose-50 dark:bg-rose-500/10",
              },
              {
                title: "Innovación",
                desc: "Metodologías actualizadas en educación especializada.",
                icon: Lightbulb,
                color: "text-larioja-amarillo",
                bg: "bg-yellow-50 dark:bg-larioja-amarillo/10",
              },
              {
                title: "Inclusión",
                desc: "Promoviendo la participación activa en la sociedad.",
                icon: Users,
                color: "text-blue-500",
                bg: "bg-blue-50 dark:bg-blue-500/10",
              },
              {
                title: "Calidad",
                desc: "Excelencia en todos nuestros programas y servicios.",
                icon: ShieldCheck,
                color: "text-larioja-verde",
                bg: "bg-green-50 dark:bg-larioja-verde/10",
              },
            ].map((value, idx) => (
              <ScrollReveal key={value.title} delay={idx * 100}>
                <div className="bg-gray-50 dark:bg-slate-900/30 p-8 rounded-3xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 group h-full">
                  <div
                    className={`w-14 h-14 ${value.bg} rounded-2xl flex items-center justify-center ${value.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <value.icon size={28} />
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

      {/* Timeline Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-larioja-azul dark:text-white tracking-tight">
                  Nuestro{" "}
                  <span className="text-larioja-amarillo">Recorrido</span>
                </h2>
                <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10 before:h-full pb-4">
                  {[
                    { year: "2009", event: "Fundación de CFL La Rioja" },
                    { year: "2012", event: "Apertura del Taller de Panadería" },
                    {
                      year: "2015",
                      event: "Expansión de Talleres Vocacionales",
                    },
                    {
                      year: "2018",
                      event: "Reconocimiento como Centro de Excelencia",
                    },
                    {
                      year: "2021",
                      event: "Alianza con Ministerio de Educación",
                    },
                    {
                      year: "2024",
                      event: "Ampliación de Instalaciones y Programas",
                    },
                  ].map((item, idx) => (
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
              <div className="relative">
                <div className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-larioja-azul/20 z-10" />
                  <Image
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Estudiantes en taller"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
                {/* Decorative floating badge */}
                <div className="absolute -bottom-8 -right-8 bg-white dark:bg-larioja-azul p-8 rounded-3xl shadow-2xl z-20 border border-gray-100 dark:border-white/5 animate-bounce-slow">
                  <div className="text-center">
                    <span className="text-4xl font-black text-larioja-azul dark:text-larioja-amarillo block">
                      16+
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Años de Historia
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
            {[
              {
                label: "Egresados",
                val: "500+",
                icon: GraduationCap,
                color: "text-blue-500",
              },
              {
                label: "Retención",
                val: "95%",
                icon: TrendingUp,
                color: "text-emerald-500",
              },
              {
                label: "Alianzas",
                val: "15+",
                icon: Briefcase,
                color: "text-larioja-amarillo",
              },
              {
                label: "Aval MINED",
                val: "100%",
                icon: Award,
                color: "text-purple-500",
              },
              {
                label: "Estudiantes",
                val: "63",
                icon: Users,
                color: "text-larioja-verde",
              },
              {
                label: "Profesionales",
                val: "20",
                icon: Star,
                color: "text-orange-500",
              },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={idx * 50}>
                <div className="text-center group">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon size={32} />
                  </div>
                  <div className="text-3xl font-black text-larioja-azul dark:text-white mb-1">
                    {stat.val}
                  </div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
                Nuestro Equipo{" "}
                <span className="text-larioja-verde">Profesional</span>
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/60">
                20 profesionales apasionados y dedicados a la excelencia
                educativa y el desarrollo integral.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                role: "Directora",
                desc: "Liderazgo general y visión estratégica.",
                spec: "Educación Especial",
              },
              {
                role: "Directora Académica",
                desc: "Coordinación de programas educativos.",
                spec: "Magíster en Educación",
              },
              {
                role: "Coordinador de Talleres",
                desc: "Supervisión de capacitación práctica.",
                spec: "Formación Vocacional",
              },
              {
                role: "Psicólogo/a",
                desc: "Acompañamiento emocional y social.",
                spec: "Psicología Clínica",
              },
            ].map((member, idx) => (
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
            ))}
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
                  ¿Listo para ser parte de nuestra comunidad?
                </h2>
                <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Conoce nuestros programas vocacionales y descubre cómo podemos
                  apoyar el desarrollo integral de tus seres queridos.
                </p>
                <Link
                  href="/bingo"
                  className="inline-flex items-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl text-lg group"
                >
                  Ver Programas
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

      {/* Footer minimalista */}
      <footer className="py-12 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="La Rioja Logo"
              width={180}
              height={50}
              className="mx-auto brightness-0 dark:invert opacity-50"
            />
          </div>
          <p className="text-gray-400 text-sm">
            © <DynamicYear /> Centro de Formación Laboral La Rioja. Formando
            futuros, integrando vidas.
          </p>
        </div>
      </footer>
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
