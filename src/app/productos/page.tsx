import { Metadata } from "next";
import { HeartHandshake } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { getPublicProducts } from "@/app/admin/productos/actions";
import { getPageContent } from "@/services/cms";

export const metadata: Metadata = {
  title: "Productos | La Rioja",
  description:
    "Conoce los productos elaborados por los estudiantes de los talleres de La Rioja. Cada compra apoya su formación laboral.",
};

export const revalidate = 60;

/** Sección del CMS (`site_content`) usada por esta página. */
interface CmsSection {
  section_key: string;
  title?: string | null;
  description?: string | null;
  metadata?: { badge?: string } | null;
}

/**
 * Página pública del catálogo de productos hechos por los estudiantes.
 * Los textos del encabezado se editan en el CMS (página `productos`,
 * claves `productos_hero` y `productos_mensaje`); el WhatsApp proviene de
 * `social media / whatsapp`.
 */
export default async function ProductosPage() {
  const [products, content, socialMedia] = await Promise.all([
    getPublicProducts(),
    getPageContent("productos") as Promise<CmsSection[]>,
    getPageContent("social media") as Promise<CmsSection[]>,
  ]);

  const hero = content.find((s) => s.section_key === "productos_hero");
  const mensaje = content.find((s) => s.section_key === "productos_mensaje");

  // Número normalizado a solo dígitos para wa.me (igual que en /bingo).
  const whatsappDigits =
    socialMedia.find((l) => l.section_key === "whatsapp")?.description?.replace(/\D/g, "") ||
    undefined;

  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-hidden">
      <Navbar brandHeader />

      {/* Hero */}
      <section className="relative pt-40 pb-10 md:pt-52 md:pb-14 bg-larioja-azul text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-larioja-azul via-larioja-azul to-blue-900 opacity-50 z-0" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-larioja-verde/10 rounded-full blur-2xl z-0" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-larioja-amarillo/5 rounded-full blur-2xl z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full bg-larioja-amarillo text-larioja-azul text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                {hero?.metadata?.badge || "Hecho por nuestros estudiantes"}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight break-words [overflow-wrap:anywhere]">
                {hero?.title || "Nuestros Productos"}
              </h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
                {hero?.description ||
                  "Productos elaborados con dedicación en nuestros talleres de formación laboral. Haz tu pedido por WhatsApp."}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Catálogo */}
      <section className="py-16 md:py-24 min-h-[60vh] bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <ProductCatalog products={products} whatsappDigits={whatsappDigits} />
        </div>
      </section>

      {/* Mensaje institucional */}
      <section className="py-20 bg-white dark:bg-larioja-azul">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-larioja-verde/15 text-larioja-verde flex items-center justify-center">
                <HeartHandshake size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-larioja-azul dark:text-white">
                {mensaje?.title || "Cada compra apoya su formación"}
              </h2>
              <p className="text-lg text-gray-600 dark:text-white/70 leading-relaxed">
                {mensaje?.description ||
                  "Lo recaudado se reinvierte en los talleres y programas de formación laboral para personas con discapacidad intelectual."}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
