"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Expand, X, ZoomIn, ZoomOut } from "lucide-react";

export interface WorkshopPhotoProps {
  src: string;
  alt: string;
  insignia?: string;
  nombre: string;
  enlace?: string;
  enlaceTexto?: string;
  /** "auto" detecta si la foto es vertical/cuadrada u horizontal; "contain" muestra completa; "cover" llena el marco. */
  imageFit?: "auto" | "contain" | "cover";
}

/**
 * Encabezado visual de cada tarjeta de taller en `WorkshopsTeaser`.
 * - Separado del bloque de texto para no tapar el trabajo de los estudiantes.
 * - Si la foto es vertical o cuadrada (`height >= width * 0.92`), la muestra completa (`object-contain`)
 *   sobre un fondo desenfocado sin recortar rostros ni manos.
 * - Si la foto es horizontal, llena el recuadro (`object-cover`).
 * - Permite ampliar cualquier foto en un visor modal renderizado en `document.body`.
 */
export function WorkshopPhoto({
  src,
  alt,
  insignia,
  nombre,
  enlace,
  enlaceTexto,
  imageFit = "auto",
}: WorkshopPhotoProps) {
  const [detectedVertical, setDetectedVertical] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const isVertical =
    imageFit === "contain" ? true : imageFit === "cover" ? false : detectedVertical;

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setIsZoomed(false);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  const handleImageLoad = (img: HTMLImageElement) => {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setDetectedVertical(img.naturalHeight >= img.naturalWidth * 0.92);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsLightboxOpen(true)}
        className="group/photo relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden bg-slate-950 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
        aria-label={`Ampliar fotografía del taller de ${nombre}: ${alt}`}
      >
        {isVertical ? (
          <>
            {/* Fondo atmosférico desenfocado para rellenar laterales en fotos verticales */}
            <Image
              src={src}
              alt=""
              fill
              aria-hidden="true"
              sizes="(max-width: 768px) 100vw, 50vw"
              className="scale-110 object-cover opacity-45 blur-xl"
            />
            <div className="absolute inset-0 bg-slate-950/30" />
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={(e) => handleImageLoad(e.currentTarget)}
              className="object-contain p-1.5 transition-transform duration-500 group-hover/photo:scale-[1.03]"
            />
          </>
        ) : (
          <>
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={(e) => handleImageLoad(e.currentTarget)}
              className="object-cover transition-transform duration-700 group-hover/photo:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/20" />
          </>
        )}

        {/* Insignia del taller en la esquina superior izquierda */}
        <span className="pointer-events-none absolute left-4 top-4 z-10 inline-block rounded-full bg-larioja-amarillo px-3 py-0.5 text-[11px] font-extrabold text-larioja-azul shadow-sm">
          {insignia || "Taller Productivo"}
        </span>

        {/* Indicador discreto para ampliar foto */}
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white opacity-85 backdrop-blur-sm transition-all group-hover/photo:bg-larioja-azul group-hover/photo:opacity-100">
          <Expand className="h-3 w-3" aria-hidden="true" />
          Ver foto
        </span>
      </button>

      {isLightboxOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Taller de ${nombre}`}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden overscroll-contain bg-black/85 p-3 sm:p-6 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <div
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden overscroll-contain rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 truncate pr-3">
                  <span className="shrink-0 rounded-full bg-larioja-amarillo px-2.5 py-0.5 text-[11px] font-extrabold text-larioja-azul">
                    {insignia || "Taller Productivo"}
                  </span>
                  <span className="truncate font-montserrat text-sm font-bold">
                    {nombre}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsZoomed((z) => !z)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
                    aria-label={isZoomed ? "Reducir zoom" : "Acercar imagen"}
                  >
                    {isZoomed ? (
                      <>
                        <ZoomOut className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Ajustar</span>
                      </>
                    ) : (
                      <>
                        <ZoomIn className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Zoom</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo"
                    aria-label="Cerrar vista ampliada"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="relative h-[58vh] w-full overflow-auto overscroll-contain bg-slate-900 p-3 sm:h-[70vh] sm:p-5">
                <div
                  className={`flex min-h-full w-full justify-center ${
                    isZoomed ? "items-start" : "items-center"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt}
                    onClick={() => setIsZoomed((z) => !z)}
                    className={`select-none rounded-lg shadow-lg ${
                      isZoomed
                        ? "h-auto w-full max-w-[680px] cursor-zoom-out"
                        : "max-h-[52vh] w-auto max-w-full cursor-zoom-in object-contain sm:max-h-[64vh]"
                    }`}
                  />
                </div>
              </div>

              {enlace && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <span className="hidden text-xs text-slate-400 sm:inline">{alt}</span>
                  <Link
                    href={enlace}
                    onClick={closeLightbox}
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full bg-larioja-amarillo px-5 py-2.5 text-xs font-extrabold text-larioja-azul transition-transform hover:scale-[1.02]"
                  >
                    {enlaceTexto || "Ver en La Rioja Shop →"}
                  </Link>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
