"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play, Video, Youtube } from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/video-url";
import type { SiteGalleryItem } from "@/types/cms";

interface FacilitiesLightboxProps {
  items: SiteGalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function FacilitiesLightbox({
  items,
  initialIndex,
  onClose,
}: FacilitiesLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(items.length - 1, initialIndex)),
  );
  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const currentItem = items[currentIndex];
  const total = items.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      // Pausar video HTML5 si se está reproduciendo
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlayingYouTube(false);
      setCurrentIndex((prev) => (prev + delta + total) % total);
    },
    [total],
  );

  // Bloqueo de scroll en body mientras el visor está abierto
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Manejo de teclado (Esc, Flechas, Trampa de foco)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // No interceptar flechas si el usuario está interactuando con controles nativos del video
      const activeEl = document.activeElement;
      const isFocusedOnVideo = activeEl?.tagName === "VIDEO";

      if (e.key === "ArrowLeft" && !isFocusedOnVideo) {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === "ArrowRight" && !isFocusedOnVideo) {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "Tab" && dialogRef.current) {
        // Trampa de foco accesible
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onClose]);

  // Gestos táctiles de deslizamiento (Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 50) {
      navigate(deltaX < 0 ? 1 : -1);
    }
  };

  if (!mounted || !currentItem) return null;

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de instalaciones"
      className="fixed inset-0 z-[9999] bg-white/98 dark:bg-black/95 backdrop-blur-md text-larioja-azul dark:text-white flex flex-col justify-between select-none animate-fade-in"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 z-30">
        <span
          className="text-xs sm:text-sm font-montserrat font-bold px-3.5 py-1.5 rounded-full bg-larioja-azul text-white dark:bg-white/15 dark:text-white backdrop-blur-md shadow-sm"
          aria-live="polite"
        >
          {currentIndex + 1} / {total}
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor de instalaciones"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-larioja-azul text-white hover:bg-larioja-azul-profundo active:scale-95 dark:bg-white/15 dark:text-white dark:hover:bg-white/25 flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo cursor-pointer shadow-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* Área principal multimedia */}
      <div
        className="flex-1 flex items-center justify-between px-3 sm:px-8 relative min-h-0 w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Botón Anterior (Desplazar hacia atrás) */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Elemento anterior"
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-larioja-azul text-white hover:bg-larioja-azul-profundo active:scale-95 flex items-center justify-center transition-all z-30 shrink-0 shadow-xl cursor-pointer border border-larioja-azul/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo"
        >
          <ChevronLeft size={30} />
        </button>

        {/* Contenedor central del medio activo */}
        <div className="flex-1 h-full flex flex-col items-center justify-center px-2 sm:px-6 min-w-0">
          <figure className="m-0 w-full h-full flex flex-col items-center justify-center">
            {/* Marco de imagen/video */}
            <div className="relative w-full max-w-4xl h-[56vh] sm:h-[64vh] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/10">
              {/* Imagen */}
              {currentItem.media_type === "image" && (
                <div className="relative w-full h-full">
                  <Image
                    src={currentItem.media_url}
                    alt={currentItem.alt_text}
                    fill
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    quality={85}
                    priority
                    className="object-contain rounded-xl"
                  />
                </div>
              )}

              {/* Video HTML5 */}
              {currentItem.media_type === "video" && (
                <video
                  ref={videoRef}
                  key={currentItem.id}
                  src={currentItem.media_url}
                  controls
                  playsInline
                  preload="metadata"
                  poster={currentItem.poster_url || undefined}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                  aria-label={currentItem.alt_text}
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              )}

              {/* Video de YouTube con Facade */}
              {currentItem.media_type === "youtube" && currentItem.youtube_id && (
                <div className="relative w-full h-full aspect-video flex items-center justify-center bg-black">
                  {isPlayingYouTube ? (
                    <iframe
                      src={youTubeEmbedUrl(currentItem.youtube_id, true)}
                      title={currentItem.alt_text}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      className="relative w-full h-full group cursor-pointer"
                      onClick={() => setIsPlayingYouTube(true)}
                    >
                      <Image
                        src={
                          currentItem.poster_url ||
                          `https://i.ytimg.com/vi/${currentItem.youtube_id}/hqdefault.jpg`
                        }
                        alt={currentItem.alt_text}
                        fill
                        className="object-cover brightness-90 group-hover:brightness-100 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play size={30} className="ml-1" fill="currentColor" />
                        </div>
                        <span className="text-xs font-montserrat font-bold px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                          Reproducir video en YouTube
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie y leyendas */}
            <figcaption className="mt-3 text-center max-w-2xl px-4 select-text">
              {currentItem.caption && (
                <p className="m-0 font-montserrat font-bold text-lg sm:text-xl text-larioja-azul dark:text-larioja-amarillo leading-tight">
                  {currentItem.caption}
                </p>
              )}
              <p className="m-0 mt-1 text-sm text-slate-700 dark:text-gray-300 font-medium leading-normal">
                {currentItem.alt_text}
              </p>
            </figcaption>
          </figure>
        </div>

        {/* Botón Siguiente (Desplazar hacia adelante) */}
        <button
          type="button"
          onClick={() => navigate(1)}
          aria-label="Elemento siguiente"
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-larioja-azul text-white hover:bg-larioja-azul-profundo active:scale-95 flex items-center justify-center transition-all z-30 shrink-0 shadow-xl cursor-pointer border border-larioja-azul/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo"
        >
          <ChevronRight size={30} />
        </button>
      </div>

      {/* Tira inferior de miniaturas navegable */}
      <div className="flex items-center justify-start sm:justify-center gap-2 px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-white/10 overflow-x-auto z-30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it, idx) => {
          const isSelected = idx === currentIndex;
          const thumb = it.poster_url || it.media_url;
          return (
            <button
              key={it.id}
              ref={(node) => {
                if (isSelected && node) {
                  node.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                  });
                }
              }}
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.pause();
                setIsPlayingYouTube(false);
                setCurrentIndex(idx);
              }}
              aria-current={isSelected ? "true" : undefined}
              aria-label={`Ir al elemento ${idx + 1}: ${it.caption || it.alt_text}`}
              className={`relative flex-shrink-0 w-20 sm:w-21 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-larioja-azul ring-2 ring-larioja-azul/40 dark:border-larioja-amarillo dark:ring-larioja-amarillo/40 opacity-100 scale-105 shadow-md"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  sizes="84px"
                  className="object-cover"
                />
              ) : null}
              {it.media_type === "video" && (
                <span className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white">
                  <Video size={10} />
                </span>
              )}
              {it.media_type === "youtube" && (
                <span className="absolute bottom-0.5 right-0.5 p-0.5 rounded bg-red-600 text-white">
                  <Youtube size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
