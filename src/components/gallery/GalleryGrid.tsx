"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Download, Share2, Maximize2, Heart } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 py-8">
      {/* Grid Layout to preserve horizontal order. Sin aspect fijo ni
          object-cover: cada ventana se adapta al tamaño real de la imagen
          (vertical u horizontal) sin recortarla. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 animate-fade-in"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={image.image_url}
              alt={image.caption || "Bingo La Rioja 2026"}
              width={0}
              height={0}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-larioja-azul/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
              <div className="flex justify-end gap-2">
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                  <Heart size={18} />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-white">
                <p className="text-sm font-medium truncate pr-4">
                  {image.caption || "Bingo La Rioja 2026"}
                </p>
                <div className="flex gap-2">
                   <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                    <Maximize2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>

          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center animate-scale-in"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption || "Bingo La Rioja 2026"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
            />
            
            <div className="mt-6 flex flex-col items-center gap-4 text-white w-full">
              <h3 className="text-xl font-montserrat font-semibold text-larioja-amarillo">
                {selectedImage.caption || "Bingo La Rioja 2026"}
              </h3>
              
              <div className="flex gap-6">
                <a 
                  href={selectedImage.image_url} 
                  download 
                  className="flex items-center gap-2 px-6 py-2 bg-larioja-azul hover:bg-larioja-azul/80 text-white rounded-full font-medium transition-all transform hover:scale-105"
                >
                  <Download size={18} /> Descargar
                </a>
                <button className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all transform hover:scale-105">
                  <Share2 size={18} /> Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
