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
  Star
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ContactTrigger } from "@/components/layout/ContactTrigger";

export const metadata: Metadata = {
  title: "Programas - La Rioja",
  description: "Descubre nuestros programas de formación laboral, talleres vocacionales y proyectos de inclusión diseñados para potenciar el talento de cada estudiante.",
};

/**
 * Programs page component.
 * Displays the different educational and vocational programs offered by La Rioja.
 */
export default function ProgramsPage() {
  const programs = [
    {
      id: "vocational",
      title: "Talleres Vocacionales",
      description: "Capacitación práctica en áreas productivas para desarrollar habilidades técnicas y hábitos de trabajo.",
      icon: Briefcase,
      color: "text-larioja-azul",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      items: ["Panadería y Repostería", "Manualidades", "Servicios de Limpieza", "Embalaje y Etiquetado"]
    },
    {
      id: "independent-living",
      title: "Vida Independiente",
      description: "Entrenamiento en habilidades de la vida diaria para promover la autonomía y autodeterminación.",
      icon: Home,
      color: "text-larioja-verde",
      bg: "bg-green-50 dark:bg-green-900/20",
      items: ["Cuidado Personal", "Habilidades Domésticas", "Manejo del Dinero", "Uso de la Comunidad"]
    },
    {
      id: "social-skills",
      title: "Habilidades Sociales",
      description: "Fortalecimiento de la interacción social, comunicación y gestión emocional en diversos entornos.",
      icon: Users,
      color: "text-larioja-amarillo",
      bg: "bg-yellow-50 dark:bg-yellow-900/10",
      items: ["Comunicación Asertiva", "Resolución de Conflictos", "Trabajo en Equipo", "Inteligencia Emocional"]
    },
    {
      id: "inclusive-education",
      title: "Educación Inclusiva",
      description: "Acompañamiento pedagógico adaptado a los ritmos y estilos de aprendizaje de cada joven.",
      icon: BookOpen,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/10",
      items: ["Lectoescritura Funcional", "Cálculo Básico Aplicado", "Informática", "Cultura General"]
    }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden font-montserrat">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/20 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo/20 text-larioja-amarillo text-xs font-bold uppercase tracking-widest mb-4">
                Formación con Propósito
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                Nuestros <span className="text-larioja-amarillo">Programas</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                Modelos educativos innovadores y personalizados que transforman el potencial de nuestros estudiantes en habilidades reales para la vida y el trabajo.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-larioja-azul dark:text-white leading-tight">
                  Un enfoque integral para el <span className="text-larioja-verde">desarrollo pleno</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
                  En CFL La Rioja, entendemos que cada persona es única. Por ello, nuestros programas están diseñados para abordar todas las dimensiones del ser humano: técnica, social, emocional y académica.
                </p>
                <div className="space-y-4">
                  {[
                    "Atención personalizada (grupos reducidos)",
                    "Metodología 100% práctica y funcional",
                    "Acompañamiento por profesionales especializados",
                    "Evaluación continua del progreso"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-larioja-verde/20 rounded-full flex items-center justify-center text-larioja-verde">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-gray-700 dark:text-white/80 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal direction="right">
              <div className="relative">
                <div className="aspect-video relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800">
                  <Image 
                    src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Estudiantes trabajando" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-larioja-amarillo p-6 rounded-3xl shadow-xl hidden md:block">
                  <Star className="text-larioja-azul w-8 h-8 mb-2" />
                  <p className="text-larioja-azul font-bold text-sm leading-tight">Excelencia en<br/>Educación Especial</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
            {programs.map((program, idx) => (
              <ScrollReveal key={program.id} delay={idx * 100} direction={idx % 2 === 0 ? "left" : "right"}>
                <div className="bg-gray-50 dark:bg-slate-900/30 rounded-[2.5rem] p-10 h-full border border-transparent hover:border-larioja-verde/20 transition-all duration-500 group flex flex-col">
                  <div className={`w-16 h-16 ${program.bg} rounded-2xl flex items-center justify-center ${program.color} mb-8 group-hover:scale-110 transition-transform`}>
                    <program.icon size={32} />
                  </div>
                  <h3 className="text-3xl font-bold mb-6 text-larioja-azul dark:text-white">{program.title}</h3>
                  <p className="text-gray-500 dark:text-white/60 mb-8 leading-relaxed">
                    {program.description}
                  </p>
                  
                  <div className="mt-auto">
                    <h4 className="text-sm font-black uppercase tracking-widest text-larioja-verde mb-4">Módulos principales:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {program.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-larioja-amarillo" />
                          {item}
                        </li>
                      ))}
                    </ul>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-white">Nuestra <span className="text-larioja-amarillo">Propuesta de Valor</span></h2>
            
            <div className="grid sm:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-larioja-amarillo">
                  <Utensils size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">Taller de Panadería</h3>
                <p className="text-white/60 text-sm">Nuestro taller insignia donde los jóvenes aprenden el arte de la panadería tradicional y gourmet.</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-larioja-verde">
                  <Palette size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">Arte e Innovación</h3>
                <p className="text-white/60 text-sm">Expresión creativa aplicada a productos comercializables, fomentando el emprendimiento.</p>
              </div>
              
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-rose-400">
                  <Heart size={40} />
                </div>
                <h3 className="text-xl font-bold text-white">Bienestar Familiar</h3>
                <p className="text-white/60 text-sm">Acompañamiento a padres y cuidadores para un entorno de apoyo integral en el hogar.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="bg-larioja-verde p-12 md:p-20 rounded-[3rem] relative overflow-hidden text-center max-w-5xl mx-auto">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-larioja-azul/10 rounded-full -ml-20 -mb-20 blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight">
                  ¿Quieres inscribir a tu hijo/a?
                </h2>
                <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Estamos aquí para guiarte en el proceso. Conoce los requisitos y agenda una visita para conocer nuestras instalaciones.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ContactTrigger>
                    {(openModal) => (
                      <button
                        onClick={openModal}
                        className="inline-flex items-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl text-lg group w-full sm:w-auto"
                      >
                        Agendar Cita
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </ContactTrigger>
                  <Link
                    href="/faq"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-12 rounded-full transition-all text-lg backdrop-blur-sm w-full sm:w-auto"
                  >
                    Ver Preguntas
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
