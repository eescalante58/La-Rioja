import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import EventInfoBanner from "@/components/gallery/EventInfoBanner";
import { getGalleryImages, getGalleryEvent } from "@/app/admin/cms/gallery-actions";
import { getPageContent, getPageTabTitle } from "@/services/cms";
import type { SiteContent } from "@/types/cms";

export async function generateMetadata(): Promise<Metadata> {
  const tabTitle = await getPageTabTitle("bingo", "Galería La Rioja 2026 | La Rioja");
  return {
    title: { absolute: tabTitle },
    description: "Galería de fotos oficial del Bingo La Rioja 2026.",
    alternates: { canonical: "/bingo" },
    openGraph: {
      title: tabTitle,
      description: "Galería de fotos oficial del Bingo La Rioja 2026.",
      url: "/bingo",
    },
  };
}

export default async function BingoPage() {
  const { data: images = [] } = await getGalleryImages();
  const socialMedia = await getPageContent("social media");
  const bingoCMS = await getPageContent("bingo");

  // Link de WhatsApp normalizado a wa.me/<solo dígitos> para evitar el error
  // "número no existe" si el CMS guarda "+", espacios u otro formato.
  const whatsappRaw = socialMedia.find((l: SiteContent) => l.section_key === "whatsapp")?.description;
  const whatsappDigits = whatsappRaw?.replace(/\D/g, "");
  const whatsappLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : undefined;

  // Los datos del evento se obtienen del event_id del que provienen las imágenes
  // (la primera imagen activa, ordenada por event_id descendente).
  let event = null;
  if (images && images.length > 0) {
    const { company_id, event_id } = images[0];
    const { data } = await getGalleryEvent(company_id, event_id);
    event = data ?? null;
  }

  // Link al video promocional desde el CMS (Key: Anuncio).
  // Se busca prioritariamente en el campo image_url (donde se subió el video)
  // y como fallback en description.
  const anuncioSection = bingoCMS.find((l: SiteContent) => l.section_key === "Anuncio");
  const videoLink = anuncioSection?.image_url || anuncioSection?.description || "https://www.facebook.com/reels/1DGYgNZRQ6/";

  return (
    <main className="min-h-screen bg-white dark:bg-black font-inter">
      <Navbar />

      <div id="contenido" className="pt-8 lg:pt-14">
        <GalleryHeader eventName={event?.event_name} images={images} />
      </div>

      {event && (
        <EventInfoBanner 
          event={event} 
          whatsappLink={whatsappLink} 
          videoLink={videoLink}
          videoTitle={anuncioSection?.title}
        />
      )}

      {images.length > 0 ? (
        <GalleryGrid images={images} />
      ) : (
        <div className="py-20 text-center">
          <p className="text-gray-500 italic">No hay fotos publicadas en la galería aún.</p>
        </div>
      )}

      {/* Footer minimalista */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-900 text-center space-y-2">
        <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Bingo La Rioja - El Salvador
        </p>
        <p>
          <Link
            href="/privacidad"
            className="inline-flex min-h-[44px] items-center text-xs text-gray-500 hover:text-larioja-azul dark:text-gray-400 dark:hover:text-larioja-amarillo underline underline-offset-4"
          >
            Política de privacidad
          </Link>
        </p>
      </footer>
    </main>
  );
}
