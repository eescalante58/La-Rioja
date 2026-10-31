"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Video,
  Youtube,
  Smartphone,
} from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/video-url";
import type { SiteGalleryItem } from "@/types/cms";

interface FacilitiesLightboxProps {
  items: SiteGalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

const NAV_BTN =
  "absolute top-1/2 z-10 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full " +
  "bg-black/45 text-white backdrop-blur-sm shadow-lg transition hover:bg-black/65 active:scale-95 " +
  "sm:h-14 sm:w-14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-amarillo cursor-pointer";

const ROTATE_KEY = "larioja_rotate_notice_seen";

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
  const [showRotateNotice, setShowRotateNotice] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailsNavRef = useRef<HTMLElement>(null);
  const thumbBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  const currentItem = items[currentIndex];
  const total = items.length;

  const prevIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;
  const prevItem = items[prevIndex];
  const nextItem = items[nextIndex];

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

  // Centrar miniatura activa dentro de la tira con scrollTo (sin mover la página)
  useEffect(() => {
    const nav = thumbnailsNavRef.current;
    const btn = thumbBtnRefs.current[currentIndex];
    if (!nav || !btn) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({
      left: btn.offsetLeft - (nav.clientWidth - btn.clientWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [currentIndex]);

  // Aviso de rotar teléfono si la foto es panorámica y el dispositivo está en vertical
  const handleImageLoaded = useCallback((ratio: number) => {
    if (ratio >= 1.6) {
      try {
        const seen = sessionStorage.getItem(ROTATE_KEY);
        const isPortraitMobile = window.matchMedia(
          "(orientation: portrait) and (max-width: 639px)",
        ).matches;
        if (!seen && isPortraitMobile) {
          setShowRotateNotice(true);
          sessionStorage.setItem(ROTATE_KEY, "true");
        }
      } catch {
        // En caso de que sessionStorage no esté disponible
      }
    }
  }, []);

  // Ocultar aviso de rotación tras 4s o al cambiar orientación
  useEffect(() => {
    if (!showRotateNotice) return;
    const timer = setTimeout(() => setShowRotateNotice(false), 4000);
    return () => clearTimeout(timer);
  }, [showRotateNotice]);

  useEffect(() => {
    const mql = window.matchMedia("(orientation: portrait) and (max-width: 639px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setShowRotateNotice(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  if (!mounted || !currentItem) return null;

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de instalaciones"
      className="fixed inset-0 z-[9999] grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto_auto] landscape-phone:grid-rows-[1fr] bg-[#0A0C14] text-white select-none animate-fade-in"
    >
      {/* 1. Barra superior */}
      <header className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3 z-30 border-b border-white/10 landscape-phone:border-0 landscape-phone:absolute landscape-phone:inset-x-0 landscape-phone:top-0 landscape-phone:z-20 landscape-phone:bg-gradient-to-b landscape-phone:from-black/60">
        <span
          className="text-xs sm:text-sm font-montserrat font-bold px-3.5 py-1.5 rounded-full bg-white/15 text-white backdrop-blur-md shadow-sm"
          aria-live="polite"
        >
          {currentIndex + 1} / {total}
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor de instalaciones"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-amarillo cursor-pointer"
        >
          <X size={24} />
        </button>
      </header>

      {/* 2. Escenario a pantalla completa */}
      <div
        className="relative min-h-0 w-full h-full touch-pan-y sm:px-20 landscape-phone:px-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full w-full flex items-center justify-center">
          {/* Imagen */}
          {currentItem.media_type === "image" && (
            <div className="relative w-full h-full">
              <Image
                src={currentItem.media_url}
                alt={currentItem.alt_text}
                fill
                sizes="100vw"
                priority
                className="object-contain"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    handleImageLoaded(img.naturalWidth / img.naturalHeight);
                  }
                }}
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
              className="max-h-full max-w-full object-contain"
              aria-label={currentItem.alt_text}
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          )}

          {/* Video de YouTube con Facade */}
          {currentItem.media_type === "youtube" && currentItem.youtube_id && (
            <div className="aspect-video w-full max-h-full m-auto flex items-center justify-center bg-black">
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

        {/* Flechas flotantes anterior / siguiente */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Foto anterior"
          className={`${NAV_BTN} left-2 sm:left-4`}
        >
          <ChevronLeft size={26} />
        </button>

        <button
          type="button"
          onClick={() => navigate(1)}
          aria-label="Foto siguiente"
          className={`${NAV_BTN} right-2 sm:right-4`}
        >
          <ChevronRight size={26} />
        </button>

        {/* Aviso de orientación: Gira tu teléfono */}
        {showRotateNotice && (
          <div
            role="status"
            onClick={() => setShowRotateNotice(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/80 text-white text-xs font-montserrat font-semibold backdrop-blur-md shadow-xl border border-white/20 cursor-pointer animate-fade-in"
          >
            <Smartphone size={16} className="rotate-90 shrink-0 text-larioja-amarillo" />
            <span>Gira tu teléfono para ver la foto más grande</span>
          </div>
        )}
      </div>

      {/* 3. Leyenda */}
      <figcaption className="px-4 pt-2 pb-1 text-center landscape-phone:hidden select-text">
        {currentItem.caption && (
          <p className="m-0 font-montserrat font-bold text-[17px] sm:text-xl text-larioja-amarillo leading-tight">
            {currentItem.caption}
          </p>
        )}
        <p className="m-0 mt-0.5 text-sm text-white/75 line-clamp-2 sm:line-clamp-none leading-normal">
          {currentItem.alt_text}
        </p>
      </figcaption>

      {/* 4. Miniaturas */}
      <nav
        ref={thumbnailsNavRef}
        aria-label="Miniaturas"
        className="flex items-center justify-start sm:justify-center gap-2 px-4 sm:px-6 py-2 border-t border-white/10 overflow-x-auto z-30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] landscape-phone:hidden"
      >
        {items.map((it, idx) => {
          const isSelected = idx === currentIndex;
          const thumb = it.poster_url || it.media_url;
          return (
            <button
              key={it.id}
              ref={(node) => {
                thumbBtnRefs.current[idx] = node;
              }}
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.pause();
                setIsPlayingYouTube(false);
                setCurrentIndex(idx);
              }}
              aria-current={isSelected ? "true" : undefined}
              aria-label={`Ir al elemento ${idx + 1}: ${it.caption || it.alt_text}`}
              className={`relative flex-shrink-0 h-11 w-16 sm:h-14 sm:w-24 rounded-lg overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? "ring-2 ring-larioja-amarillo opacity-100 scale-105 shadow-md"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  sizes="96px"
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
      </nav>

      {/* Precarga de fotos vecinas para transición instantánea */}
      <div
        className="absolute -left-[9999px] top-0 w-px h-px overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {prevItem && prevItem.media_type === "image" && (
          <Image
            src={prevItem.media_url}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="pointer-events-none opacity-0"
            aria-hidden="true"
          />
        )}
        {nextItem && nextItem.media_type === "image" && (
          <Image
            src={nextItem.media_url}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="pointer-events-none opacity-0"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
