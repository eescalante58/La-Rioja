import { Camera, Share2 } from "lucide-react";
import SlideshowButton from "@/components/gallery/SlideshowButton";

interface GalleryImage {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
}

interface GalleryHeaderProps {
  eventName?: string;
  images: GalleryImage[];
}

/**
 * Encabezado de la página pública de la galería. El título corresponde al
 * `event_name` del evento del que provienen las imágenes.
 */
export default function GalleryHeader({ eventName, images }: GalleryHeaderProps) {
  return (
    <header className="w-full bg-white dark:bg-black py-12 px-6 border-b border-gray-100 dark:border-gray-900">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-montserrat font-black tracking-tighter text-larioja-azul dark:text-white uppercase">
            {eventName || "LA RIOJA 2026"}
          </h1>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <Camera size={18} className="text-larioja-verde" />
            <span className="tracking-widest uppercase text-xs">Galería</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
            <Share2 size={16} /> Compartir
          </button>
          <SlideshowButton images={images} />
        </div>
      </div>
    </header>
  );
}
