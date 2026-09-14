import { Metadata } from "next";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import { getGalleryImages } from "@/app/admin/cms/gallery-actions";

export const metadata: Metadata = {
  title: "Galería La Rioja 2026",
  description: "Galería de fotos oficial del Bingo La Rioja 2026.",
};

export default async function BingoPage() {
  const { data: images = [] } = await getGalleryImages();

  return (
    <main className="min-h-screen bg-white dark:bg-black font-inter">
      <GalleryHeader />
      
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
