"use client";

import React, { useState } from "react";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import {
  Wallet,
  Package,
  GraduationCap,
  Building2,
  CheckCircle2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold text-larioja-azul dark:text-white group-hover:text-larioja-verde transition-colors">
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="text-larioja-verde shrink-0" size={24} />
        ) : (
          <ChevronDown className="text-gray-400 shrink-0" size={24} />
        )}
      </button>
      {isOpen && (
        <div className="pb-6">
          <p className="text-gray-600 dark:text-white/70 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

export function ContactClient() {
  const formsOfSupport = [
    {
      title: "Donativos Monetarios",
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      features: [
        "Donativo único o recurrente",
        "Deducción fiscal disponible",
        "Transparencia total en uso de fondos",
        "Reconocimiento como donante (opcional)",
      ],
    },
    {
      title: "Donativos en Especie",
      icon: Package,
      color: "text-larioja-verde",
      bg: "bg-green-50 dark:bg-larioja-verde/10",
      features: [
        "Materiales para talleres (madera, telas, etc.)",
        "Equipo y herramientas",
        "Alimentos para los estudiantes",
        "Servicios profesionales",
      ],
    },
    {
      title: "Patrocinio de Estudiantes",
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      features: [
        "Cobertura de matrícula y materiales",
        "Seguimiento del progreso del estudiante",
        "Contacto directo con la familia",
        "Reportes periódicos",
      ],
    },
    {
      title: "Alianzas Empresariales",
      icon: Building2,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      features: [
        "Programas de inserción laboral",
        "Patrocinios de talleres",
        "Responsabilidad Social Corporativa",
        "Visibilidad de marca",
      ],
    },
  ];

  const impactData = [
    {
      value: "$25",
      label: "Materiales educativos para un estudiante por un mes",
    },
    {
      value: "$100",
      label: "Equipo y herramientas para un taller",
    },
    {
      value: "$300",
      label: "Educación completa de un estudiante por 3 meses",
    },
  ];

  const faqs = [
    {
      question: "¿Los donativos son deductibles de impuestos?",
      answer:
        "Sí, CFL La Rioja está registrado como institución de beneficio público. Puedes solicitar el recibo fiscal para tus donativos.",
    },
    {
      question: "¿Cómo sé en qué se usa mi donativo?",
      answer:
        "Mantenemos total transparencia. Recibirás reportes periódicos sobre cómo se utilizan tus contribuciones en nuestros programas.",
    },
    {
      question: "¿Puedo visitar el centro?",
      answer:
        "Sí, con cita previa. Las visitas nos ayudan a conectar con nuestros donantes y a mostrar el impacto real de su apoyo.",
    },
    {
      question: "¿Hay oportunidades de voluntariado?",
      answer:
        "Consideramos voluntarios calificados en áreas específicas. Contacta para conocer las oportunidades disponibles.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/10 rounded-full blur-2xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/5 rounded-full blur-2xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo text-larioja-azul text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                Súmate a la Causa
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-8 tracking-tight break-words [overflow-wrap:anywhere]">
                <HighlightedTitle title="Apóyanos" />
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light">
                Hay muchas formas de ser parte de nuestra misión de educar y
                transformar vidas. Tu apoyo hace la diferencia.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Forms of Support Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight break-words [overflow-wrap:anywhere]">
                <HighlightedTitle
                  title="Formas de Apoyar"
                  highlightColor="text-larioja-verde"
                />
              </h2>
              <p className="text-lg text-gray-500 dark:text-white/60">
                Elige la que mejor se adapte a tus posibilidades
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {formsOfSupport.map((form, idx) => (
              <ScrollReveal key={form.title} delay={idx * 100}>
                <div className="bg-white dark:bg-larioja-azul p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5 h-full flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
                  <div
                    className={`w-14 h-14 ${form.bg} rounded-2xl flex items-center justify-center ${form.color} mb-6`}
                  >
                    <form.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-6 text-larioja-azul dark:text-white">
                    {form.title}
                  </h3>
                  <ul className="space-y-4 mb-8 flex-1">
                    {form.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-gray-600 dark:text-white/70"
                      >
                        <CheckCircle2
                          size={18}
                          className={`${form.color} shrink-0 mt-0.5`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-4 px-6 rounded-2xl font-bold transition-all ${form.color} ${form.bg} hover:scale-105 active:scale-95`}
                  >
                    Saber más
                  </button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tu Impacto Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-larioja-azul rounded-3xl p-6 sm:p-10 md:p-20 relative overflow-hidden">
            <div className="relative z-10">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight break-words [overflow-wrap:anywhere]">
                    Tu <span className="text-larioja-verde">Impacto</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                    Mira cómo tu donativo transforma vidas
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {impactData.map((impact, idx) => (
                  <ScrollReveal key={idx} delay={idx * 100}>
                    <div className="text-center group">
                      <div className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 group-hover:scale-105 transition-transform duration-300 break-words [overflow-wrap:anywhere]">
                        {impact.value}
                      </div>
                      <p className="text-white/60 text-lg leading-relaxed">
                        {impact.label}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight break-words [overflow-wrap:anywhere]">
                  <HighlightedTitle
                    title="Preguntas Frecuentes"
                    highlightColor="text-larioja-verde"
                  />
                </h2>
                <p className="text-lg text-gray-500 dark:text-white/60">
                  Todo lo que necesitas saber sobre cómo apoyarnos
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-8 md:p-12 shadow-inner">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {faqs.map((faq, idx) => (
                    <FAQItem key={idx} {...faq} />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50 overflow-hidden">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="bg-larioja-amarillo p-6 sm:p-10 md:p-20 rounded-3xl relative overflow-hidden text-center max-w-5xl mx-auto shadow-lg">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-6 sm:mb-8 text-larioja-azul tracking-tight break-words [overflow-wrap:anywhere]">
                  ¿Tienes más <span className="text-white">preguntas?</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-larioja-azul/80 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium">
                  Estamos aquí para ayudarte. No dudes en contactarnos con
                  cualquier inquietud.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                  <a
                    href="tel:+50378580322"
                    className="inline-flex items-center justify-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl group"
                  >
                    <Phone size={20} />
                    Llamar ahora
                  </a>
                  <a
                    href="mailto:info@cflrioja.org"
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-larioja-azul font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl group"
                  >
                    <Mail size={20} />
                    Escribir correo
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
