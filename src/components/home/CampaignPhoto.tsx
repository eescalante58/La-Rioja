"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Maximize2 } from "lucide-react";

interface CampaignPhotoProps {
  src: string;
  alt: string;
  tag: string;
}

/**
 * Bloque de imagen de una campaña con lightbox al hacer clic.
 * Client Component mínimo; usa createPortal para evitar conflictos de
 * z-index con el Navbar (z-50) y con modales admin (z-[100]).
 */
export function CampaignPhoto({ src, alt, tag }: CampaignPhotoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Imagen en tarjeta */}
      <div
        className="relative aspect-[16/10] cursor-zoom-in overflow-hidden"
        onClick={() => setOpen(true)}
        role="button"
        aria-label={`Ver foto de ${alt} en tamaño completo`}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradiente para legibilidad de texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Etiqueta de campaña */}
        <span className="absolute left-3 top-3 rounded-full bg-larioja-amarillo px-3 py-1 text-xs font-bold text-larioja-azul">
          {tag}
        </span>
        {/* Ícono de zoom — visible en hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-black/40 p-3 backdrop-blur-sm">
            <Maximize2 className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Lightbox — montado en document.body vía portal */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              className="absolute right-5 top-5 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X size={28} />
            </button>

            <div
              className="relative w-full max-w-5xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Image
                src={src}
                alt={alt}
                width={1400}
                height={875}
                className="h-auto max-h-[90vh] w-full rounded-xl object-contain shadow-2xl"
                priority
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
