import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import EventInfoBanner from "@/components/gallery/EventInfoBanner";
import { getGalleryImages, getGalleryEvent } from "@/app/admin/cms/gallery-actions";
import { getPageContent } from "@/services/cms";

export const metadata: Metadata = {
  title: "Galería La Rioja 2026",
  description: "Galería de fotos oficial del Bingo La Rioja 2026.",
};

export default async function BingoPage() {
  const { data: images = [] } = await getGalleryImages();
  const socialMedia = await getPageContent("social media");

  // Link de WhatsApp normalizado a wa.me/<solo dígitos> para evitar el error
  // "número no existe" si el CMS guarda "+", espacios u otro formato.
  const whatsappRaw = socialMedia.find((l: any) => l.section_key === "whatsapp")?.description;
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

  return (
    <main className="min-h-screen bg-white dark:bg-black font-inter">
      <Navbar solid />

      <div className="pt-20">
        <GalleryHeader eventName={event?.event_name} images={images} />
      </div>

      {event && <EventInfoBanner event={event} whatsappLink={whatsappLink} />}

      {images.length > 0 ? (
        <GalleryGrid images={images} />
      ) : (
        <div className="py-20 text-center">
          <p className="text-gray-500 italic">No hay fotos publicadas en la galería aún.</p>
        </div>
      )}

      {/* Footer minimalista */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-900 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Bingo La Rioja - El Salvador
        </p>
      </footer>
    </main>
  );
}
