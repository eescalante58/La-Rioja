import { Metadata } from "next";
import { HeartHandshake } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { ShopCatalog } from "@/components/products/ShopCatalog";
import { ShopHero } from "@/components/products/ShopHero";
import { GiftsBanner, HowToBuy } from "@/components/products/ShopExtras";
import {
  heroPhotos,
  sectionsWithPrefix,
  type CmsSection,
} from "@/components/products/shop-content";
import { getPublicShop } from "@/app/admin/productos/actions";
import { getPageContent } from "@/services/cms";

export const metadata: Metadata = {
  title: "La Rioja Shop | La Rioja",
  description:
    "Conoce los productos elaborados por los estudiantes de los talleres de La Rioja. Cada compra apoya su formación laboral.",
};

export const revalidate = 60;

/**
 * La Rioja Shop: catálogos de los talleres (Arte y Costura, Panadería) con
 * canasta que registra el pedido y lo envía por WhatsApp.
 * Textos e imágenes se editan en el CMS (página `productos`): hero
 * (`productos_hero`, `productos_hero_foto_N`), mensaje (`productos_mensaje`),
 * regalos empresariales (`productos_regalos`) y «Cómo comprar»
 * (`productos_como_comprar`, `productos_paso_N`). Regalos y «Cómo comprar»
 * solo se muestran si su fila existe y está activa. El WhatsApp proviene de
 * `social media / whatsapp tienda` (o `whatsapp`).
 */
export default async function ProductosPage() {
  const [catalogs, content, socialMedia] = await Promise.all([
    getPublicShop(),
    getPageContent("productos") as Promise<CmsSection[]>,
    getPageContent("social media") as Promise<CmsSection[]>,
  ]);

  const hero = content.find((s) => s.section_key === "productos_hero");
  const mensaje = content.find((s) => s.section_key === "productos_mensaje");
  const regalos = content.find((s) => s.section_key === "productos_regalos");
  const comoComprar = content.find((s) => s.section_key === "productos_como_comprar");
  const pasos = sectionsWithPrefix(content, "productos_paso_");

  // WhatsApp de pedidos de la tienda (CMS: social media → «whatsapp tienda»);
  // si no existe, el WhatsApp institucional. Solo dígitos para wa.me.
  const whatsappSource =
    socialMedia.find((l) => l.section_key === "whatsapp tienda")?.description ||
    socialMedia.find((l) => l.section_key === "whatsapp")?.description;
  const whatsappDigits = whatsappSource?.replace(/\D/g, "") || undefined;

  return (
    <main className="min-h-screen bg-white dark:bg-larioja-azul overflow-x-clip">
      <Navbar brandHeader />

      <ShopHero hero={hero} photos={heroPhotos(content, catalogs)} />

      {/* Catálogo */}
      <section
        id="catalogo"
        className="py-16 md:py-24 min-h-[60vh] bg-gray-50 dark:bg-slate-900/50 scroll-mt-[98px] md:scroll-mt-[132px] lg:scroll-mt-[140px]"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <ShopCatalog catalogs={catalogs} whatsappDigits={whatsappDigits} />
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

      {/* Regalos empresariales y Cómo comprar (CMS; se ocultan desactivándolos) */}
      {regalos && <GiftsBanner section={regalos} whatsappDigits={whatsappDigits} />}
      {comoComprar && <HowToBuy section={comoComprar} steps={pasos} />}

      <Footer />
    </main>
  );
}
