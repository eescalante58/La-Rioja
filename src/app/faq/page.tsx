import { createStaticClient } from "@/lib/supabase/server";
import { getSectionContent } from "@/services/cms";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { Faq } from "@/types/cms";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | La Rioja",
  description:
    "Respuestas a las preguntas más comunes sobre nuestros programas, inscripción, servicios y cómo apoyar nuestra misión en El Salvador.",
  keywords: [
    "preguntas frecuentes",
    "ayuda",
    "soporte",
    "discapacidad intelectual",
    "El Salvador",
    "La Rioja FAQ",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Preguntas Frecuentes | La Rioja",
    description:
      "Respuestas a las preguntas más comunes sobre nuestros programas, inscripción, servicios y cómo apoyar nuestra misión en El Salvador.",
    url: "/faq",
  },
};

export const revalidate = 60;

export default async function FAQPage() {
  const supabase = createStaticClient();

  // Fetch sections, faqs, and dynamic contact phone from database/CMS
  const [sectionsResult, ctaContent] = await Promise.all([
    supabase
      .from("faq_sections")
      .select("*, faqs(*)")
      .eq("is_active", true)
      .order("content_order", { ascending: true }),
    getSectionContent("home", "cl_cta"),
  ]);

  const sections = sectionsResult.data;
  const ctaMeta = (ctaContent?.metadata ?? {}) as Record<string, string>;
  const telefonoContacto = ctaMeta.telefono_1 || "7731-0792";
  const telDigits = telefonoContacto.replace(/\D/g, "");
  const telHref = `tel:+${telDigits.startsWith("503") ? telDigits : `503${telDigits}`}`;

  return (
    <main className="min-h-screen overflow-x-clip bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section
        id="contenido"
        className="relative overflow-hidden bg-[#0A0C14] text-white pt-8 lg:pt-14 pb-20"
      >
        <AuroraBackground />
        <div className="container relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in break-words [overflow-wrap:anywhere]">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-2xl mx-auto">
            Respuestas a las preguntas más comunes sobre nuestros programas,
            inscripción y servicios.
          </p>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-16">
            {sections?.map((section) => (
              <div key={section.id} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-larioja-azul dark:text-larioja-amarillo">
                    {section.title}
                  </h2>
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-4"
                >
                  {section.faqs
                    ?.filter((faq: Faq) => faq.is_active)
                    .sort((a: Faq, b: Faq) => (a.content_order ?? 0) - (b.content_order ?? 0))
                    .map((faq: Faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline text-left text-larioja-azul dark:text-white font-semibold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-larioja-azul dark:text-larioja-amarillo mb-6">
            ¿Aún tienes preguntas?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
            Si no encuentras la respuesta que buscas, no dudes en contactarnos.
            Nuestro equipo está disponible para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              asChild
              className="bg-larioja-azul hover:bg-larioja-azul/90 text-white rounded-full px-8 py-6 h-auto text-lg shadow-xl shadow-larioja-azul/20"
            >
              <Link href="/apoyanos" className="flex items-center gap-2">
                <MessageSquare size={20} />
                Enviar Consulta
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-larioja-azul text-larioja-azul hover:bg-larioja-azul/5 rounded-full px-8 py-6 h-auto text-lg"
            >
              <a href={telHref} className="flex items-center gap-2">
                <Phone size={20} />
                Llamar: {telefonoContacto}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Programs Link CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-larioja-verde/5 dark:bg-larioja-verde/10 p-6 sm:p-12 rounded-3xl border border-larioja-verde/20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-larioja-verde mb-4">
              ¿Listo para conocer más?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              Visita nuestros programas y conoce cómo podemos apoyar a tu
              familia.
            </p>
            <Button
              asChild
              className="bg-larioja-verde hover:bg-larioja-verde/90 text-white rounded-full px-8"
            >
              <Link href="/programs" className="flex items-center gap-2">
                Ver Programas
                <ChevronRight size={20} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
