"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Play, ArrowRight, Expand } from "lucide-react";
import { formatDuration } from "@/lib/video-url";
import type { SiteGalleryItem } from "@/types/cms";

const FacilitiesLightbox = dynamic(() => import("./FacilitiesLightbox"), {
  ssr: false,
});

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==";

interface FacilitiesMosaicProps {
  items: SiteGalleryItem[];
  visibleCount: number;
  showCaptions: boolean;
}

export function FacilitiesMosaic({
  items,
  visibleCount,
  showCaptions,
}: FacilitiesMosaicProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const triggerButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const total = items.length;
  const countToShow = Math.min(visibleCount, total);

  // Abrir lightbox guardando referencia al botón para devolver el foco accesible al cerrar
  const handleOpen = (index: number) => {
    setOpenIndex(index);
  };

  const handleClose = () => {
    const idx = openIndex;
    setOpenIndex(null);
    if (idx !== null && triggerButtonRefs.current.has(idx)) {
      setTimeout(() => {
        triggerButtonRefs.current.get(idx)?.focus();
      }, 50);
    }
  };

  // Cálculo del índice visible en el carrusel móvil mediante scroll pasivo
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleScroll = () => {
      const firstChild = el.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const cardWidth = firstChild.getBoundingClientRect().width + 12; // gap
      const current = Math.round(el.scrollLeft / cardWidth);
      setCarouselIndex(Math.max(0, Math.min(total - 1, current)));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [total]);

  if (total === 0) return null;

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. VISTA ESCRITORIO Y TABLETA (>= 640px)                  */}
      {/* ========================================================= */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, countToShow).map((item, idx) => {
          const isFirst = idx === 0;
          const isLastWithMore = idx === countToShow - 1 && total > countToShow;
          const remainingCount = total - countToShow + 1;
          const isVideo = item.media_type === "video";
          const isYouTube = item.media_type === "youtube";
          const thumbSrc = item.poster_url || item.media_url;

          const ariaLabel = isLastWithMore
            ? `Ver las ${total} fotos y videos de la galería de instalaciones`
            : isVideo || isYouTube
              ? `Ver video: ${item.caption || item.alt_text} (${idx + 1} de ${total})`
              : `Ver foto: ${item.caption || item.alt_text} (${idx + 1} de ${total})`;

          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) triggerButtonRefs.current.set(idx, node);
                else triggerButtonRefs.current.delete(idx);
              }}
              type="button"
              onClick={() => handleOpen(idx)}
              aria-label={ariaLabel}
              className={`group relative overflow-hidden rounded-[18px] bg-gray-100 dark:bg-gray-900 border-0 p-0 text-left cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo shadow-sm hover:shadow-md ${
                isFirst
                  ? "col-span-2 row-span-2 aspect-[16/9] lg:aspect-auto"
                  : "aspect-[16/10]"
              }`}
            >
              {/* Imagen de fondo / portada */}
              <div className="relative w-full h-full">
                <Image
                  src={thumbSrc}
                  alt=""
                  fill
                  sizes={
                    isFirst
                      ? "(min-width: 1024px) 620px, 100vw"
                      : "(min-width: 1024px) 300px, 50vw"
                  }
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover transform group-hover:scale-[1.04] transition-transform duration-500 motion-reduce:transform-none"
                />
              </div>

              {/* Distintivo de video con botón Play centrado */}
              {(isVideo || isYouTube) && !isLastWithMore && (
                <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/95 dark:bg-gray-900/95 text-larioja-azul dark:text-larioja-amarillo flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={22} className="ml-0.5" fill="currentColor" />
                </div>
              )}

              {/* Insignia de duración en video */}
              {isVideo && item.duration_seconds && !isLastWithMore && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-bold font-mono backdrop-blur-sm">
                  {formatDuration(item.duration_seconds)}
                </span>
              )}

              {isYouTube && !isLastWithMore && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold font-montserrat backdrop-blur-sm">
                  YouTube
                </span>
              )}

              {/* Ícono de zoom sutil al pasar cursor */}
              {!isLastWithMore && !isVideo && !isYouTube && (
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-larioja-azul flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <Expand size={15} />
                </span>
              )}

              {/* Leyenda sobre degradado oscuro */}
              {showCaptions && item.caption && !isLastWithMore && (
                <div className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-[#0A0C14]/85 via-[#0A0C14]/40 to-transparent">
                  <p
                    className={`m-0 font-montserrat font-bold text-white leading-snug drop-shadow-sm ${
                      isFirst ? "text-base sm:text-lg" : "text-sm sm:text-[15px]"
                    }`}
                  >
                    {item.caption}
                  </p>
                </div>
              )}

              {/* Capa de «+N fotos / Ver todas» en la última casilla cuando hay excedente */}
              {isLastWithMore && (
                <div className="absolute inset-0 bg-larioja-azul/85 dark:bg-larioja-azul-profundo/90 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 text-center">
                  <span className="font-montserrat font-extrabold text-3xl sm:text-4xl text-larioja-amarillo">
                    +{remainingCount}
                  </span>
                  <span className="font-montserrat font-bold text-sm sm:text-base mt-1">
                    Ver todas
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 2. VISTA CELULAR (< 640px): CARRUSEL HORIZONTAL           */}
      {/* ========================================================= */}
      <div className="sm:hidden space-y-3">
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 -mx-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, idx) => {
            const isVideo = item.media_type === "video";
            const isYouTube = item.media_type === "youtube";
            const thumbSrc = item.poster_url || item.media_url;

            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) triggerButtonRefs.current.set(idx, node);
                }}
                type="button"
                onClick={() => handleOpen(idx)}
                aria-label={
                  isVideo || isYouTube
                    ? `Ver video: ${item.caption || item.alt_text} (${idx + 1} de ${total})`
                    : `Ver foto: ${item.caption || item.alt_text} (${idx + 1} de ${total})`
                }
                className="group relative flex-shrink-0 basis-[85%] snap-center aspect-[16/10] overflow-hidden rounded-[18px] bg-gray-100 dark:bg-gray-900 border-0 p-0 text-left shadow-md cursor-pointer"
              >
                <Image
                  src={thumbSrc}
                  alt=""
                  fill
                  sizes="85vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />

                {(isVideo || isYouTube) && (
                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/95 text-larioja-azul flex items-center justify-center shadow-lg">
                    <Play size={20} className="ml-0.5" fill="currentColor" />
                  </div>
                )}

                {isVideo && item.duration_seconds && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono font-bold">
                    {formatDuration(item.duration_seconds)}
                  </span>
                )}

                {showCaptions && item.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-[#0A0C14]/85 to-transparent">
                    <p className="m-0 font-montserrat font-bold text-white text-sm">
                      {item.caption}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Contador móvil y puntos de navegación */}
        <div className="flex items-center justify-between pt-1">
          <span
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-larioja-azul dark:text-larioja-amarillo font-montserrat font-bold text-xs"
            aria-live="polite"
          >
            {carouselIndex + 1} / {total}
          </span>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === carouselIndex
                    ? "w-6 bg-larioja-azul dark:bg-larioja-amarillo"
                    : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pie de sección: botón accesible para abrir galería completa */}
      <div className="pt-2 flex justify-between items-center text-sm text-gray-500">
        <button
          type="button"
          onClick={() => handleOpen(0)}
          className="inline-flex items-center gap-1.5 font-montserrat font-bold text-[15px] text-larioja-azul-enlace dark:text-larioja-amarillo hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul-enlace dark:focus-visible:outline-larioja-amarillo min-h-[44px] cursor-pointer"
        >
          Ver galería completa ({total})
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Visor modal accesible (cargado de forma diferida) */}
      {openIndex !== null && (
        <FacilitiesLightbox
          items={items}
          initialIndex={openIndex}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
