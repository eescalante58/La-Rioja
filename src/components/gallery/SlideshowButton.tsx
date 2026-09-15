"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Pause, X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
}

const SLIDE_INTERVAL_MS = 4000;

/**
 * Botón "Diapositivas" del encabezado de la galería. Al activarse abre una
 * presentación a pantalla completa que avanza automáticamente cada 4
 * segundos, con controles de play/pausa, anterior/siguiente, cierre y
 * navegación por teclado (Escape, flechas, espacio).
 */
export default function SlideshowButton({ images }: { images: GalleryImage[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const total = images.length;

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const open = () => {
    if (total === 0) return;
    setIndex(0);
    setIsPlaying(true);
    setIsOpen(true);
  };

  const close = useCallback(() => setIsOpen(false), []);

  // Avance automático de la presentación
  useEffect(() => {
    if (!isOpen || !isPlaying || total <= 1) return;
    const timer = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOpen, isPlaying, total, goNext]);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, goNext, goPrev]);

  // Bloquea el scroll del fondo mientras la presentación está abierta
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const current = images[index];

  return (
    <>
      <button
        onClick={open}
        disabled={total === 0}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-larioja-azul text-white text-sm font-semibold hover:bg-larioja-azul/90 transition-all shadow-lg shadow-larioja-azul/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play size={16} fill="currentColor" /> Diapositivas
      </button>

      {isOpen && current && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
            onClick={close}
            aria-label="Cerrar presentación"
          >
            <X size={32} />
          </button>

          <div className="absolute top-6 left-6 text-white/70 text-sm font-mono">
            {index + 1} / {total}
          </div>

          <div className="relative flex items-center justify-center w-full max-w-6xl">
            {total > 1 && (
              <button
                className="absolute left-0 md:-left-4 p-2 text-white/70 hover:text-white transition-colors z-10"
                onClick={goPrev}
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={40} />
              </button>
            )}

            <img
              key={current.id + index}
              src={current.image_url}
              alt={current.caption || "Bingo La Rioja 2026"}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10 animate-fade-in"
            />

            {total > 1 && (
              <button
                className="absolute right-0 md:-right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
                onClick={goNext}
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={40} />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {current.caption && (
              <h3 className="text-xl font-montserrat font-semibold text-larioja-amarillo text-center">
                {current.caption}
              </h3>
            )}

            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? (
                  <>
                    <Pause size={18} /> Pausar
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" /> Reproducir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
