import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import DynamicYear from "@/components/layout/DynamicYear";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
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
};

export default async function FAQPage() {
  const supabase = createClient();

  // Fetch sections and faqs from database
  const { data: sections } = await supabase
    .from("faq_sections")
    .select("*, faqs(*)")
    .eq("is_active", true)
    .order("content_order", { ascending: true });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-larioja-azul text-white pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent z-10" />
        <div className="container mx-auto px-6 relative z-20 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-2xl mx-auto">
            Respuestas a las preguntas más comunes sobre nuestros programas,
            inscripción y servicios.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-larioja-verde/10 rounded-full blur-3xl z-0" />
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-larioja-amarillo/10 rounded-full blur-3xl z-0" />
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
                    ?.filter((faq: any) => faq.is_active)
                    .sort((a: any, b: any) => a.content_order - b.content_order)
                    .map((faq: any) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:no-underline text-left text-larioja-azul dark:text-white font-semibold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
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
              <Link href="/contact" className="flex items-center gap-2">
                <MessageSquare size={20} />
                Enviar Consulta
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-larioja-azul text-larioja-azul hover:bg-larioja-azul/5 rounded-full px-8 py-6 h-auto text-lg"
            >
              <a href="tel:+50378580322" className="flex items-center gap-2">
                <Phone size={20} />
                Llamar: 7858-0322
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Programs Link CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="bg-larioja-verde/5 dark:bg-larioja-verde/10 p-12 rounded-3xl border border-larioja-verde/20 max-w-4xl mx-auto">
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

      {/* Simple Footer */}
      <footer className="bg-larioja-azul text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="opacity-70 mb-4 font-bold">La Rioja</p>
          <p className="opacity-50 text-sm">
            &copy; <DynamicYear /> Centro de Formación Laboral La Rioja. Todos
            los derechos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
