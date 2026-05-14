"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { submitContactForm } from "@/app/actions/contact";
import {
  Heart,
  Wallet,
  Package,
  GraduationCap,
  Building2,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Send,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
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

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      type: formData.get("type") as string,
      message: formData.get("message") as string,
      targetEmail: "info@cflrioja.org", // Email institucional por defecto
    };

    try {
      const result = await submitContactForm(data);
      if (result.success) {
        setStatus({
          type: "success",
          message:
            "¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.",
        });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus({
          type: "error",
          message: result.error || "Ocurrió un error al enviar el mensaje.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Error de conexión. Por favor, intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

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
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden font-montserrat">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/20 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo/20 text-larioja-amarillo text-xs font-bold uppercase tracking-widest mb-4">
                Súmate a la Causa
              </span>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
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
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
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
                <div className="bg-white dark:bg-larioja-azul p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-white/5 h-full flex flex-col group hover:-translate-y-1 transition-all duration-300">
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
          <div className="bg-larioja-azul rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-larioja-verde/20 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-larioja-amarillo/10 rounded-full -ml-20 -mb-20 blur-3xl" />

            <div className="relative z-10">
              <ScrollReveal>
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                    Tu <span className="text-larioja-verde">Impacto</span>
                  </h2>
                  <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Mira cómo tu donativo transforma vidas
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                {impactData.map((impact, idx) => (
                  <ScrollReveal key={idx} delay={idx * 100}>
                    <div className="text-center group">
                      <div className="text-5xl md:text-6xl font-black text-white mb-4 group-hover:scale-110 transition-transform duration-300">
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

      {/* Contact & Form Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 max-w-6xl mx-auto">
            {/* Info Side */}
            <ScrollReveal direction="left">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-larioja-azul dark:text-white tracking-tight">
                  <HighlightedTitle title="Información de Contacto" />
                </h2>
                <p className="text-lg text-gray-500 dark:text-white/60 mb-12">
                  Estamos aquí para escucharte y trabajar juntos por un futuro
                  mejor.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-larioja-azul dark:text-larioja-amarillo group-hover:scale-110 transition-transform">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        Teléfonos
                      </h4>
                      <p className="text-gray-600 dark:text-white/60">
                        7858-0322
                      </p>
                      <p className="text-gray-600 dark:text-white/60">
                        2248-4198
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 bg-green-100 dark:bg-larioja-verde/20 rounded-2xl flex items-center justify-center text-larioja-verde group-hover:scale-110 transition-transform">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        Correo
                      </h4>
                      <p className="text-gray-600 dark:text-white/60">
                        info@cflrioja.org
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        Ubicación
                      </h4>
                      <p className="text-gray-600 dark:text-white/60">
                        Residencial Altamira, San Salvador
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                      <Instagram size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                        Síguenos
                      </h4>
                      <p className="text-gray-600 dark:text-white/60">
                        @larioja_sv
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 p-8 bg-larioja-verde/5 border border-larioja-verde/10 rounded-[2rem]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-larioja-verde/20 rounded-xl flex items-center justify-center text-larioja-verde">
                      <Clock size={20} />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      Horario de Atención
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-white/60">
                    <p className="flex justify-between">
                      <span>Lunes a Viernes:</span>
                      <span className="font-medium">8:00 AM - 5:00 PM</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Sábado:</span>
                      <span className="font-medium">9:00 AM - 12:00 PM</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Domingo:</span>
                      <span className="font-medium">Cerrado</span>
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Form Side */}
            <ScrollReveal direction="right">
              <div className="bg-white dark:bg-larioja-azul p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-gray-100 dark:border-white/5 relative">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-larioja-amarillo rounded-full flex items-center justify-center text-larioja-azul rotate-12 shadow-xl hidden md:flex">
                  <MessageCircle size={40} />
                </div>

                <h3 className="text-2xl font-bold mb-2 text-larioja-azul dark:text-white">
                  Formulario de Contacto
                </h3>
                <p className="text-gray-500 dark:text-white/60 mb-8">
                  Envíanos un mensaje y te responderemos pronto.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-white/80 ml-1">
                        Nombre *
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        disabled={loading}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-larioja-verde outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-white/80 ml-1">
                        Correo *
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        disabled={loading}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-larioja-verde outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-white/80 ml-1">
                        Teléfono
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        disabled={loading}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-larioja-verde outline-none transition-all text-gray-900 dark:text-white disabled:opacity-50"
                        placeholder="7000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-white/80 ml-1">
                        Asunto *
                      </label>
                      <select
                        name="type"
                        disabled={loading}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-larioja-verde outline-none transition-all text-gray-900 dark:text-white appearance-none disabled:opacity-50"
                      >
                        <option value="Información General">
                          Información General
                        </option>
                        <option value="Donativos Monetarios">
                          Donativos Monetarios
                        </option>
                        <option value="Donativos en Especie">
                          Donativos en Especie
                        </option>
                        <option value="Voluntariado">Voluntariado</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-white/80 ml-1">
                      Mensaje *
                    </label>
                    <textarea
                      name="message"
                      required
                      disabled={loading}
                      rows={4}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-larioja-verde outline-none transition-all text-gray-900 dark:text-white resize-none disabled:opacity-50"
                      placeholder="¿En qué podemos ayudarte?"
                    ></textarea>
                  </div>

                  {status && (
                    <div
                      className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                    >
                      {status.type === "success" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      <p className="text-sm font-medium">{status.message}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-5 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Mensaje
                        <Send
                          size={20}
                          className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-larioja-azul dark:text-white tracking-tight">
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
              <div className="bg-gray-50 dark:bg-white/5 rounded-[3rem] p-8 md:p-12">
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
            <div className="bg-larioja-amarillo p-12 md:p-20 rounded-[3rem] relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full -ml-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-larioja-verde/20 rounded-full -mr-20 -mb-20 blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold mb-8 text-larioja-azul tracking-tight">
                  ¿Tienes más <span className="text-white">preguntas?</span>
                </h2>
                <p className="text-xl text-larioja-azul/80 mb-12 max-w-2xl mx-auto font-medium">
                  Estamos aquí para ayudarte. No dudes en contactarnos con
                  cualquier inquietud.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                  <a
                    href="tel:+50378580322"
                    className="inline-flex items-center gap-2 bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl group"
                  >
                    <Phone size={20} />
                    Llamar ahora
                  </a>
                  <a
                    href="mailto:info@cflrioja.org"
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-larioja-azul font-bold py-4 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl group"
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

      <Footer />
    </main>
  );
}
