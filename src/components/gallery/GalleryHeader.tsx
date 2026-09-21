import { Camera } from "lucide-react";
import SlideshowButton from "@/components/gallery/SlideshowButton";
import ShareButton from "@/components/gallery/ShareButton";

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
      <div className="max-w-[1600px] mx-auto flex flex-col items-center text-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-montserrat font-black tracking-tighter text-larioja-azul dark:text-white uppercase">
            {eventName || "LA RIOJA 2026"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <Camera size={18} className="text-larioja-verde" />
            <span className="tracking-widest uppercase text-xs">Galería</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ShareButton eventName={eventName} />
          <SlideshowButton images={images} />
        </div>
      </div>
    </header>
  );
}
